const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

function checkLowStock() {
  return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

// GET /api/adjustments
router.get('/', (req, res) => {
  const adjustments = [...store.adjustments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(adjustments);
});

// POST /api/adjustments
router.post('/', (req, res) => {
  const { product_id, qty_counted, location, reason } = req.body;
  if (!product_id || qty_counted === undefined)
    return res.status(400).json({ error: 'product_id and qty_counted are required' });

  const product = store.products.find(p => p.id === product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty_before = product.qty_on_hand;
  const difference = qty_counted - qty_before;
  const now = new Date().toISOString();

  product.qty_on_hand = qty_counted;
  product.updatedAt = now;

  const adjustment = {
    id: crypto.randomUUID(),
    product_id,
    product_name: product.name,
    location: location || product.location,
    qty_before,
    qty_counted,
    difference,
    reason: reason || '',
    createdAt: now
  };
  store.adjustments.push(adjustment);

  store.moveLogs.push({
    id: crypto.randomUUID(), date: now, type: 'adjustment',
    product_id, product_name: product.name, product_sku: product.sku,
    qty: difference, qty_before, qty_after: qty_counted,
    from_location: product.location, to_location: product.location,
    reference: adjustment.id, notes: reason || 'Stock adjustment'
  });

  const low_stock_alerts = checkLowStock();
  res.status(201).json({ adjustment, low_stock_alerts });
});

module.exports = router;