const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

function checkLowStock() {
  return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

// GET /api/receipts
router.get('/', (req, res) => {
  const { status, supplier } = req.query;
  let receipts = [...store.receipts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status) receipts = receipts.filter(r => r.status.toLowerCase() === status.toLowerCase());
  if (supplier) receipts = receipts.filter(r => r.supplier.toLowerCase().includes(supplier.toLowerCase()));
  res.json(receipts);
});

// GET /api/receipts/:id
router.get('/:id', (req, res) => {
  const receipt = store.receipts.find(r => r.id === req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  res.json(receipt);
});

// POST /api/receipts
router.post('/', (req, res) => {
  const { supplier, lines, notes } = req.body;
  if (!supplier) return res.status(400).json({ error: 'Supplier is required' });
  if (!Array.isArray(lines) || lines.length === 0)
    return res.status(400).json({ error: 'At least one line is required' });

  const enrichedLines = [];
  for (const line of lines) {
    const product = store.products.find(p => p.id === line.product_id);
    if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
    if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
    enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: 0 });
  }

  const receipt = {
    id: crypto.randomUUID(),
    reference: store.nextRef('receipt'),
    supplier: supplier.trim(),
    status: 'Draft',
    lines: enrichedLines,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    validatedAt: null
  };
  store.receipts.push(receipt);
  res.status(201).json(receipt);
});

// PUT /api/receipts/:id
router.put('/:id', (req, res) => {
  const receipt = store.receipts.find(r => r.id === req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  if (receipt.status === 'Done' || receipt.status === 'Canceled')
    return res.status(400).json({ error: `Cannot edit a ${receipt.status} receipt` });

  const { supplier, notes, lines } = req.body;
  if (supplier) receipt.supplier = supplier.trim();
  if (notes !== undefined) receipt.notes = notes;
  if (Array.isArray(lines)) {
    const enriched = [];
    for (const line of lines) {
      const product = store.products.find(p => p.id === line.product_id);
      if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
      enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: line.received_qty || 0 });
    }
    receipt.lines = enriched;
  }
  res.json(receipt);
});

// POST /api/receipts/:id/validate
router.post('/:id/validate', (req, res) => {
  const receipt = store.receipts.find(r => r.id === req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  if (receipt.status === 'Done') return res.status(400).json({ error: 'Already validated' });
  if (receipt.status === 'Canceled') return res.status(400).json({ error: 'Cannot validate a canceled receipt' });

  const now = new Date().toISOString();
  for (const line of receipt.lines) {
    const product = store.products.find(p => p.id === line.product_id);
    if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
    const qty_before = product.qty_on_hand;
    product.qty_on_hand += line.qty;
    product.updatedAt = now;
    line.received_qty = line.qty;
    store.moveLogs.push({
      id: crypto.randomUUID(), date: now, type: 'receipt',
      product_id: product.id, product_name: product.name, product_sku: product.sku,
      qty: line.qty, qty_before, qty_after: product.qty_on_hand,
      from_location: null, to_location: product.location,
      reference: receipt.reference, notes: `Receipt validated: ${receipt.reference}`
    });
  }
  receipt.status = 'Done';
  receipt.validatedAt = now;

  const low_stock_alerts = checkLowStock();
  res.json({ receipt, low_stock_alerts });
});

// POST /api/receipts/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const receipt = store.receipts.find(r => r.id === req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  if (receipt.status === 'Done') return res.status(400).json({ error: 'Cannot cancel a done receipt' });
  if (receipt.status === 'Canceled') return res.status(400).json({ error: 'Already canceled' });
  receipt.status = 'Canceled';
  res.json(receipt);
});

module.exports = router;