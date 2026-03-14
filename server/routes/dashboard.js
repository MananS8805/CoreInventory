const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const MoveLog = require('../models/MoveLog');
const Adjustment = require('../models/Adjustment');

router.get('/', async (req, res) => {
    const products = await Product.find().lean();
    const pendingStatuses = ['draft', 'waiting', 'ready'];
    const todayStr = new Date().toISOString().slice(0, 10);

    const low_stock_products = products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
    const total_inventory_value = parseFloat(products.reduce((s, p) => s + p.qty_on_hand * p.cost_price, 0).toFixed(2));

    const [receipts, deliveries, recent_moves, recentAdj] = await Promise.all([
        Receipt.find().lean(),
        Delivery.find().lean(),
        MoveLog.find().sort({ date: -1 }).limit(10).lean(),
        Adjustment.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const pending_receipts = receipts.filter(r => pendingStatuses.includes(r.status)).length;
    const pending_deliveries = deliveries.filter(d => pendingStatuses.includes(d.status)).length;
    const receipts_today = receipts.filter(r => r.createdAt.toISOString?.().slice(0, 10) === todayStr || String(r.createdAt).slice(0, 10) === todayStr).length;
    const deliveries_today = deliveries.filter(d => d.createdAt.toISOString?.().slice(0, 10) === todayStr || String(d.createdAt).slice(0, 10) === todayStr).length;

    // Stock chart — last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [], stock_in = [], stock_out = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        labels.push(dayNames[d.getDay()]);
        const dayLogs = await MoveLog.find({ date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 86400000) } }).lean();
        stock_in.push(dayLogs.filter(l => l.type === 'receipt').reduce((s, l) => s + l.qty, 0));
        stock_out.push(dayLogs.filter(l => l.type === 'delivery').reduce((s, l) => s + l.qty, 0));
    }

    res.json({
        total_products: products.length,
        low_stock_count: low_stock_products.length,
        out_of_stock_count: products.filter(p => p.qty_on_hand === 0).length,
        pending_receipts,
        pending_deliveries,
        total_inventory_value,
        receipts_today,
        deliveries_today,
        low_stock_products,
        recent_moves,
        stock_chart_data: { labels, stock_in, stock_out }
    });
});

module.exports = router;