const express = require('express');
const router = express.Router();
const store = require('../data/store');

// GET /api/moves
// Query params: ?type=&product_id=&from_date=&to_date=
router.get('/', (req, res) => {
  const { type, product_id, from_date, to_date } = req.query;
  let logs = [...store.moveLogs];

  if (type) logs = logs.filter(l => l.type === type);
  if (product_id) logs = logs.filter(l => l.product_id === product_id);
  if (from_date) logs = logs.filter(l => new Date(l.date) >= new Date(from_date));
  if (to_date) logs = logs.filter(l => new Date(l.date) <= new Date(to_date));

  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

module.exports = router;