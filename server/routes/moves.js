const express = require('express');
const router = express.Router();
const store = require('../data/store');

router.get('/', (req, res) => {
  let logs = [...store.moveLogs];
  const { product_id, type, from, to } = req.query;
  if (product_id) logs = logs.filter(l => l.product_id === product_id);
  if (type) logs = logs.filter(l => l.type === type);
  if (from) logs = logs.filter(l => new Date(l.date) >= new Date(from));
  if (to) logs = logs.filter(l => new Date(l.date) <= new Date(to));
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

module.exports = router;