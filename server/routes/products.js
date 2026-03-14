const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });
const Product = require('../models/Product');
const MoveLog = require('../models/MoveLog');

router.get('/', async (req, res) => {
  const { category, location, low_stock } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (location) filter.location = location;
  const products = await Product.find(filter).lean();
  if (low_stock === 'true') {
    return res.json(products.filter(p => p.qty_on_hand <= p.min_stock));
  }
  res.json(products);
});

router.post('/', async (req, res) => {
  const { name, sku, category, unit, qty_on_hand, cost_price, min_stock, location } = req.body;
  if (!name || !sku) return res.status(400).json({ error: 'name and sku are required' });
  const exists = await Product.findOne({ sku });
  if (exists) return res.status(409).json({ error: 'SKU already exists' });
  const product = await Product.create({ name, sku, category, unit, qty_on_hand: qty_on_hand || 0, cost_price: cost_price || 0, min_stock: min_stock || 0, location });
  if (product.qty_on_hand > 0) {
    await MoveLog.create({ type: 'receipt', product_id: product._id, product_name: product.name, product_sku: product.sku, qty: product.qty_on_hand, qty_before: 0, qty_after: product.qty_on_hand, from_location: null, to_location: product.location, reference: 'INITIAL_STOCK', notes: 'Initial stock on product creation' });
  }
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.delete('/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

router.get('/valuation', async (req, res) => {
  const products = await Product.find().lean();
  const result = products.map(p => ({ ...p, valuation: parseFloat((p.qty_on_hand * p.cost_price).toFixed(2)) }));
  const total_value = parseFloat(result.reduce((s, p) => s + p.valuation, 0).toFixed(2));
  res.json({ products: result, total_value });
});

router.get('/:id/history', async (req, res) => {
  const logs = await MoveLog.find({ product_id: req.params.id }).sort({ date: -1 }).lean();
  res.json(logs);
});

router.post('/bulk', upload.single('file'), async (req, res) => {
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

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    if (!row.name || !row.sku) {
      errors.push({ row: rowNum, sku: row.sku || '—', reason: 'name and sku required' });
      continue;
    }
    const exists = await Product.findOne({ sku: String(row.sku).trim() });
    if (exists) {
      errors.push({ row: rowNum, sku: row.sku, reason: 'SKU already exists' });
      continue;
    }
    const product = await Product.create({
      name: String(row.name).trim(),
      sku: String(row.sku).trim(),
      category: row.category ? String(row.category).trim() : '',
      unit: row.unit ? String(row.unit).trim() : 'pcs',
      qty_on_hand: Number(row.qty_on_hand) || 0,
      cost_price: Number(row.cost_price) || 0,
      min_stock: Number(row.min_stock) || 0,
      location: row.location ? String(row.location).trim() : '',
    });
    if (product.qty_on_hand > 0) {
      await MoveLog.create({ type: 'receipt', product_id: product._id, product_name: product.name, product_sku: product.sku, qty: product.qty_on_hand, qty_before: 0, qty_after: product.qty_on_hand, from_location: null, to_location: product.location, reference: 'INITIAL_STOCK', notes: 'Bulk import' });
    }
    created.push(product);
  }
  res.status(201).json({ created: created.length, failed: errors.length, errors });
});

module.exports = router;