const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');
const { getTotalStock } = require('../utils/ledger');

router.get('/', (req, res) => {
  const results = [...store.transfers].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(results);
});

router.post('/', (req, res) => {
  const { product_id, qty, from_location, to_location, notes } = req.body;

  if (!product_id || !qty || qty <= 0 || !from_location || !to_location) {
    return res.status(400).json({ error: 'product_id, qty, from_location, and to_location are required' });
  }

  if (from_location === to_location) {
    return res.status(400).json({ error: 'From and to locations must be different' });
  }

  const product = store.products.find(p => p.id === product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Initialize stock_by_location if it doesn't exist
  if (!product.stock_by_location) {
    product.stock_by_location = {};
  }

  const fromStock = product.stock_by_location[from_location] || 0;
  if (fromStock < qty) {
    return res.status(400).json({ error: 'Insufficient stock in source location for transfer' });
  }

  // Update stock in both locations
  product.stock_by_location[from_location] = fromStock - qty;
  product.stock_by_location[to_location] = (product.stock_by_location[to_location] || 0) + qty;

  store.updateProduct(product_id, {
    stock_by_location: product.stock_by_location,
    updatedAt: new Date().toISOString()
  });

  // Create transfer record
  const transfer = {
    id: crypto.randomUUID(),
    product_id,
    product_name: product.name,
    qty,
    from_location,
    to_location,
    notes: notes || '',
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  store.transfers.push(transfer);

  // Create MoveLog entry
  store.moveLogs.push({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    type: 'transfer',
    product_id,
    product_name: product.name,
    product_sku: product.sku,
    qty,
    qty_before: fromStock,
    qty_after: fromStock - qty,
    from_location,
    to_location,
    reference: transfer.id,
    notes: notes || 'Internal transfer'
  });

  res.status(201).json(transfer);
});

module.exports = router;