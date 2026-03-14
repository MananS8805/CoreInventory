const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });
const store = require('../data/store');

// GET /api/products
router.get('/', (req, res) => {
  const { category, location, low_stock } = req.query;
  let products = [...store.products];
  if (category) products = products.filter(p => p.category === category);
  if (location) products = products.filter(p => p.location === location);
  if (low_stock === 'true') products = products.filter(p => p.qty_on_hand <= p.min_stock);
  res.json(products);
});

// GET /api/products/valuation  ← must come before /:id
router.get('/valuation', (req, res) => {
  const products = store.products.map(p => ({
    ...p,
    valuation: parseFloat((p.qty_on_hand * p.cost_price).toFixed(2))
  }));
  const total_value = parseFloat(products.reduce((s, p) => s + p.valuation, 0).toFixed(2));
  res.json({ products, total_value });
});

// POST /api/products/bulk  ← must come before /:id
router.post('/bulk', upload.single('file'), (req, res) => {
  let rows = [];
  if (req.file) {
    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } catch {
      return res.status(400).json({ error: 'Failed to parse Excel file' });
    }
  } else if (req.body && Array.isArray(req.body.products)) {
    rows = req.body.products;
  } else {
    return res.status(400).json({ error: 'Send an Excel file or JSON { products: [] }' });
  }

  if (rows.length === 0) return res.status(400).json({ error: 'No rows found' });

  const created = [];
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    const sku = String(row.sku || '').trim();
    if (!row.name || !sku) {
      errors.push({ row: rowNum, sku: sku || '—', reason: 'name and sku are required' });
      continue;
    }
    if (store.products.find(p => p.sku === sku)) {
      errors.push({ row: rowNum, sku, reason: 'SKU already exists' });
      continue;
    }
    const now = new Date().toISOString();
    const product = {
      id: crypto.randomUUID(),
      name: String(row.name).trim(),
      sku,
      category: row.category ? String(row.category).trim() : '',
      unit: row.unit ? String(row.unit).trim() : 'pcs',
      qty_on_hand: Number(row.qty_on_hand) || 0,
      cost_price: Number(row.cost_price) || 0,
      min_stock: Number(row.min_stock) || 0,
      location: row.location ? String(row.location).trim() : '',
      createdAt: now,
      updatedAt: now
    };
    store.products.push(product);
    if (product.qty_on_hand > 0) {
      store.moveLogs.push({
        id: crypto.randomUUID(), date: now, type: 'receipt',
        product_id: product.id, product_name: product.name, product_sku: product.sku,
        qty: product.qty_on_hand, qty_before: 0, qty_after: product.qty_on_hand,
        from_location: null, to_location: product.location,
        reference: 'INITIAL_STOCK', notes: 'Bulk import'
      });
    }
    created.push(product);
  }
  res.status(201).json({ created: created.length, failed: errors.length, errors });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, sku, category, unit, qty_on_hand, cost_price, min_stock, location } = req.body;
  if (!name || !sku)
    return res.status(400).json({ error: 'name and sku are required' });
  if (store.products.find(p => p.sku === sku))
    return res.status(409).json({ error: 'SKU already exists' });

  const now = new Date().toISOString();
  const product = {
    id: crypto.randomUUID(), name, sku,
    category: category || '', unit: unit || 'pcs',
    qty_on_hand: Number(qty_on_hand) || 0,
    cost_price: Number(cost_price) || 0,
    min_stock: Number(min_stock) || 0,
    location: location || '',
    createdAt: now, updatedAt: now
  };
  store.products.push(product);

  if (product.qty_on_hand > 0) {
    store.moveLogs.push({
      id: crypto.randomUUID(), date: now, type: 'receipt',
      product_id: product.id, product_name: product.name, product_sku: product.sku,
      qty: product.qty_on_hand, qty_before: 0, qty_after: product.qty_on_hand,
      from_location: null, to_location: product.location,
      reference: 'INITIAL_STOCK', notes: 'Initial stock on product creation'
    });
  }
  res.status(201).json(product);
});

// GET /api/products/:id/history
router.get('/:id/history', (req, res) => {
  const logs = store.moveLogs
    .filter(l => l.product_id === req.params.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  Object.assign(product, req.body, { updatedAt: new Date().toISOString() });
  res.json(product);
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const idx = store.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  store.products.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;