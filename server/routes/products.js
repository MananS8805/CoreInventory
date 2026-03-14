const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });
const { getTotalStock } = require('../utils/ledger');

function checkLowStock() {
  return store.products.filter(p => getTotalStock(p) <= p.min_stock && getTotalStock(p) > 0);
}

router.get('/', (req, res) => {
  let products = [...store.products];
  const { category, location, low_stock } = req.query;
  if (category) products = products.filter(p => p.category === category);
  if (location) products = products.filter(p => p.stock_by_location && p.stock_by_location[location] !== undefined);
  if (low_stock === 'true') products = products.filter(p => getTotalStock(p) <= p.min_stock);
  res.json(products);
});

router.get('/valuation', (req, res) => {
  const products = store.products.map(p => ({
    ...p,
    valuation: parseFloat((getTotalStock(p) * p.cost_price).toFixed(2))
  }));
  const total_value = parseFloat(products.reduce((s, p) => s + p.valuation, 0).toFixed(2));
  res.json({ products, total_value });
});

router.get('/:id/history', (req, res) => {
  const logs = store.moveLogs
    .filter(l => l.product_id === req.params.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

router.get('/:id', (req, res) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/bulk', upload.single('file'), (req, res) => {
  let rows = [];
  if (req.file) {
    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } catch (err) {
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

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    if (!row.name || !row.sku) {
      errors.push({ row: rowNum, sku: row.sku || '—', reason: 'name and sku required' });
      return;
    }
    if (store.products.find(p => p.sku === String(row.sku).trim())) {
      errors.push({ row: rowNum, sku: row.sku, reason: 'SKU already exists' });
      return;
    }
    const product = {
      id: crypto.randomUUID(),
      name: String(row.name).trim(),
      sku: String(row.sku).trim(),
      category: row.category ? String(row.category).trim() : '',
      unit: row.unit ? String(row.unit).trim() : 'pcs',
      stock_by_location: {},
      cost_price: Number(row.cost_price) || 0,
      min_stock: Number(row.min_stock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Handle stock data - either new stock_by_location format or legacy qty_on_hand/location
    if (row.stock_by_location) {
      // New format: expect JSON string or object
      try {
        product.stock_by_location = typeof row.stock_by_location === 'string'
          ? JSON.parse(row.stock_by_location)
          : row.stock_by_location;
      } catch (e) {
        product.stock_by_location = {};
      }
    } else if (row.qty_on_hand !== undefined && row.location) {
      // Legacy format: convert to stock_by_location
      const qty = Number(row.qty_on_hand) || 0;
      const location = String(row.location).trim();
      if (qty > 0 && location) {
        product.stock_by_location[location] = qty;
      }
    } else if (row.qty_on_hand !== undefined) {
      // Default to main warehouse if no location specified
      const qty = Number(row.qty_on_hand) || 0;
      if (qty > 0) {
        product.stock_by_location['Main Warehouse'] = qty;
      }
    }

    store.pushProduct(product);

    // Create move logs for initial stock
    Object.entries(product.stock_by_location).forEach(([location, qty]) => {
      if (qty > 0) {
        store.pushMoveLog({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: 'receipt',
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          qty: qty,
          qty_before: 0,
          qty_after: qty,
          from_location: null,
          to_location: location,
          reference: 'INITIAL_STOCK',
          notes: 'Bulk import'
        });
      }
    });
    created.push(product);
  });

  res.status(201).json({ created: created.length, failed: errors.length, errors });
});

router.post('/', (req, res) => {
  const { name, sku, category, unit, stock_by_location, cost_price, min_stock, qty_on_hand, location } = req.body;
  if (!name || !sku) return res.status(400).json({ error: 'name and sku are required' });
  if (store.products.find(p => p.sku === sku))
    return res.status(409).json({ error: 'SKU already exists' });

  const product = {
    id: crypto.randomUUID(),
    name, sku, category: category || '', unit: unit || 'pcs',
    stock_by_location: stock_by_location || {},
    cost_price: cost_price || 0,
    min_stock: min_stock || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Handle legacy format for backward compatibility
  if (!stock_by_location && qty_on_hand !== undefined) {
    const qty = Number(qty_on_hand) || 0;
    const loc = location || 'Main Warehouse';
    if (qty > 0) {
      product.stock_by_location[loc] = qty;
    }
  }

  store.pushProduct(product);

  // Create move logs for initial stock
  Object.entries(product.stock_by_location).forEach(([loc, qty]) => {
    if (qty > 0) {
      store.pushMoveLog({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'receipt',
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        qty: qty,
        qty_before: 0,
        qty_after: qty,
        from_location: null,
        to_location: loc,
        reference: 'INITIAL_STOCK',
        notes: 'Initial stock on product creation'
      });
    }
  });

  res.status(201).json(product);
});

router.put('/:id', (req, res) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const updates = { ...req.body, updatedAt: new Date().toISOString() };
  store.updateProduct(req.params.id, updates);
  res.json({ ...product, ...updates });
});

router.delete('/:id', (req, res) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  store.removeProduct(req.params.id);
  res.json({ success: true });
});

module.exports = router;