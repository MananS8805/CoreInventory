const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

// ── GET /api/warehouses ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json(store.warehouses);
});

// ── POST /api/warehouses ─────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, short_code, address } = req.body;
  if (!name || !short_code) {
    return res.status(400).json({ error: 'name and short_code are required' });
  }

  const warehouse = {
    id: crypto.randomUUID(),
    name: name.trim(),
    short_code: short_code.trim().toUpperCase(),
    address: address || '',
    locations: []
  };

  store.warehouses.push(warehouse);
  res.status(201).json(warehouse);
});

// ── PUT /api/warehouses/:id ──────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const warehouse = store.warehouses.find(w => w.id === req.params.id);
  if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });

  const { name, short_code, address } = req.body;
  if (name) warehouse.name = name.trim();
  if (short_code) warehouse.short_code = short_code.trim().toUpperCase();
  if (address !== undefined) warehouse.address = address;

  res.json(warehouse);
});

// ── POST /api/warehouses/:id/locations ───────────────────────────────────────
router.post('/:id/locations', (req, res) => {
  const warehouse = store.warehouses.find(w => w.id === req.params.id);
  if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });

  const { location_name } = req.body;
  if (!location_name || !location_name.trim()) {
    return res.status(400).json({ error: 'location_name is required' });
  }
  if (warehouse.locations.includes(location_name.trim())) {
    return res.status(409).json({ error: 'Location already exists' });
  }

  warehouse.locations.push(location_name.trim());
  res.status(201).json(warehouse);
});

module.exports = router;