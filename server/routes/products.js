const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

// GET /api/products
// Query params: ?category=&location=&low_stock=true
// Return: array of all products, filtered if params provided
// If low_stock=true, return only products where qty_on_hand <= min_stock
router.get('/', (req, res) => {
  const { category, location, low_stock } = req.query;
  let products = store.products;

  if (category) {
    products = products.filter(p => p.category === category);
  }
  if (location) {
    products = products.filter(p => p.location === location);
  }
  if (low_stock === 'true') {
    products = products.filter(p => p.qty_on_hand <= p.min_stock);
  }

  res.json(products);
});

// POST /api/products
// Body: { name, sku, category, unit, qty_on_hand, cost_price, min_stock, location }
// Validate: SKU must be unique
// Auto-set createdAt, updatedAt, generate id
// If qty_on_hand > 0, create a MoveLog entry of type "receipt" with reference "INITIAL_STOCK"
// Return: created product
router.post('/', (req, res) => {
  const { name, sku, category, unit, qty_on_hand, cost_price, min_stock, location } = req.body;
  
  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const existingSku = store.products.find(p => p.sku === sku);
  if (existingSku) {
    return res.status(400).json({ error: 'SKU must be unique' });
  }

  const now = new Date().toISOString();
  const product = {
    id: crypto.randomUUID(),
    name,
    sku,
    category: category || "",
    unit: unit || "pcs",
    qty_on_hand: Number(qty_on_hand) || 0,
    cost_price: Number(cost_price) || 0,
    min_stock: Number(min_stock) || 0,
    location: location || "",
    createdAt: now,
    updatedAt: now
  };

  store.products.push(product);

  if (product.qty_on_hand > 0) {
    store.moveLogs.push({
      id: crypto.randomUUID(),
      date: now,
      type: "receipt",
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      qty: product.qty_on_hand,
      qty_before: 0,
      qty_after: product.qty_on_hand,
      from_location: null,
      to_location: product.location,
      reference: "INITIAL_STOCK",
      notes: "Initial stock creation"
    });
  }

  res.status(201).json(product);
});

module.exports = router;
