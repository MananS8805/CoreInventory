const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

function checkLowStock() {
  return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

// GET /api/deliveries
router.get('/', (req, res) => {
  const { status, customer } = req.query;
  let deliveries = [...store.deliveries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status) deliveries = deliveries.filter(d => d.status.toLowerCase() === status.toLowerCase());
  if (customer) deliveries = deliveries.filter(d => d.customer.toLowerCase().includes(customer.toLowerCase()));
  res.json(deliveries);
});

// GET /api/deliveries/:id
router.get('/:id', (req, res) => {
  const delivery = store.deliveries.find(d => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  res.json(delivery);
});

// POST /api/deliveries
router.post('/', (req, res) => {
  const { customer, lines, notes } = req.body;
  if (!customer) return res.status(400).json({ error: 'Customer is required' });
  if (!Array.isArray(lines) || lines.length === 0)
    return res.status(400).json({ error: 'At least one line is required' });

  const enrichedLines = [];
  for (const line of lines) {
    const product = store.products.find(p => p.id === line.product_id);
    if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
    if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
    enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
  }

  const delivery = {
    id: crypto.randomUUID(),
    reference: store.nextRef('delivery'),
    customer: customer.trim(),
    status: 'Draft',
    lines: enrichedLines,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    validatedAt: null
  };
  store.deliveries.push(delivery);
  res.status(201).json(delivery);
});

// PUT /api/deliveries/:id
router.put('/:id', (req, res) => {
  const delivery = store.deliveries.find(d => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.status === 'Done' || delivery.status === 'Canceled')
    return res.status(400).json({ error: `Cannot edit a ${delivery.status} delivery` });

  const { customer, notes, lines } = req.body;
  if (customer) delivery.customer = customer.trim();
  if (notes !== undefined) delivery.notes = notes;
  if (Array.isArray(lines)) {
    const enriched = [];
    for (const line of lines) {
      const product = store.products.find(p => p.id === line.product_id);
      if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
      enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
    }
    delivery.lines = enriched;
  }
  res.json(delivery);
});

// POST /api/deliveries/:id/validate
router.post('/:id/validate', (req, res) => {
  const delivery = store.deliveries.find(d => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.status === 'Done') return res.status(400).json({ error: 'Already validated' });
  if (delivery.status === 'Canceled') return res.status(400).json({ error: 'Cannot validate a canceled delivery' });

  // Check stock availability first
  const insufficient = [];
  for (const line of delivery.lines) {
    const product = store.products.find(p => p.id === line.product_id);
    if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
    if (product.qty_on_hand < line.qty) {
      insufficient.push({ product_name: product.name, required: line.qty, available: product.qty_on_hand });
    }
  }
  if (insufficient.length > 0)
    return res.status(400).json({ error: 'Insufficient stock', details: insufficient });

  const now = new Date().toISOString();
  for (const line of delivery.lines) {
    const product = store.products.find(p => p.id === line.product_id);
    const qty_before = product.qty_on_hand;
    product.qty_on_hand -= line.qty;
    product.updatedAt = now;
    store.moveLogs.push({
      id: crypto.randomUUID(), date: now, type: 'delivery',
      product_id: product.id, product_name: product.name, product_sku: product.sku,
      qty: -line.qty, qty_before, qty_after: product.qty_on_hand,
      from_location: product.location, to_location: null,
      reference: delivery.reference, notes: `Delivery validated: ${delivery.reference}`
    });
  }
  delivery.status = 'Done';
  delivery.validatedAt = now;

  const low_stock_alerts = checkLowStock();
  res.json({ delivery, low_stock_alerts });
});

// POST /api/deliveries/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const delivery = store.deliveries.find(d => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  if (delivery.status === 'Done') return res.status(400).json({ error: 'Cannot cancel a done delivery' });
  if (delivery.status === 'Canceled') return res.status(400).json({ error: 'Already canceled' });
  delivery.status = 'Canceled';
  res.json(delivery);
});

module.exports = router;