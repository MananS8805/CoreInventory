const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { checkLowStock, checkOutOfStock, getTotalStock } = require('../utils/ledger');

router.get('/', (req, res) => {
  const products = store.products;
  const pendingStatuses = ['draft', 'waiting', 'ready'];
  const todayStr = new Date().toISOString().slice(0, 10);

  const low_stock_products = checkLowStock(store);
  const total_inventory_value = parseFloat(
    products.reduce((s, p) => s + getTotalStock(p) * p.cost_price, 0).toFixed(2)
  );

  const receipts = store.receipts;
  const deliveries = store.deliveries;

  const pending_receipts = receipts.filter(r => pendingStatuses.includes(r.status)).length;
  const pending_deliveries = deliveries.filter(d => pendingStatuses.includes(d.status)).length;
  const receipts_today = receipts.filter(r => r.createdAt?.slice(0, 10) === todayStr).length;
  const deliveries_today = deliveries.filter(d => d.createdAt?.slice(0, 10) === todayStr).length;

  const recent_moves = [...store.moveLogs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels = [], stock_in = [], stock_out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    labels.push(dayNames[d.getDay()]);
    const dayLogs = store.moveLogs.filter(l => l.date?.slice(0, 10) === dateStr);
    stock_in.push(dayLogs.filter(l => l.type === 'receipt').reduce((s, l) => s + l.qty, 0));
    stock_out.push(dayLogs.filter(l => l.type === 'delivery').reduce((s, l) => s + l.qty, 0));
  }

  const transfers_today = store.transfers.filter(t => t.createdAt?.slice(0, 10) === todayStr).length;

  res.json({
    total_products: products.length,
    low_stock_count: low_stock_products.length,
    out_of_stock_count: checkOutOfStock(store).length,
    pending_receipts,
    pending_deliveries,
    total_inventory_value,
    receipts_today,
    deliveries_today,
    transfers_today,
    low_stock_products,
    recent_moves,
    stock_chart_data: { labels, stock_in, stock_out }
  });
});

module.exports = router;