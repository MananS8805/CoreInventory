const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');
const { checkLowStock, getTotalStock } = require('../utils/ledger');

// ── GET /api/adjustments ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const results = [...store.adjustments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(results);
});

// ── POST /api/adjustments ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { product_id, qty_counted, location, reason } = req.body;

  if (!product_id || qty_counted === undefined) {
    return res.status(400).json({ error: 'product_id and qty_counted are required' });
  }
  if (qty_counted < 0) {
    return res.status(400).json({ error: 'qty_counted cannot be negative' });
  }
  if (!location) {
    return res.status(400).json({ error: 'location is required for adjustments' });
  }

  const product = store.products.find(p => p.id === product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Initialize stock_by_location if it doesn't exist
  if (!product.stock_by_location) {
    product.stock_by_location = {};
  }

  const qty_before = product.stock_by_location[location] || 0;
  const difference = qty_counted - qty_before;

  // Update stock in the specific location
  product.stock_by_location[location] = qty_counted;
  store.updateProduct(product_id, {
    stock_by_location: product.stock_by_location,
    updatedAt: new Date().toISOString()
  });

  // Create adjustment record
  const adjustment = {
    id: crypto.randomUUID(),
    product_id,
    product_name: product.name,
    location: location || product.location,
    qty_before,
    qty_counted,
    difference,
    reason: reason || '',
    createdAt: new Date().toISOString()
  };

  // Push directly to store arrays
  store.adjustments.push(adjustment);

  // Create MoveLog entry
  store.moveLogs.push({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    type: 'adjustment',
    product_id,
    product_name: product.name,
    product_sku: product.sku,
    qty: difference,
    qty_before,
    qty_after: qty_counted,
    from_location: location,
    to_location: location,
    reference: adjustment.id,
    notes: reason || 'Stock adjustment'
  });

  const low_stock_alerts = checkLowStock(store);
  res.status(201).json({ adjustment, low_stock_alerts });
});

module.exports = router;