const express = require('express');
const router = express.Router();
const MoveLog = require('../models/MoveLog');

router.get('/', async (req, res) => {
    const { type, product_id, from, to } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (product_id) filter.product_id = product_id;
    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
    }
    const logs = await MoveLog.find(filter).sort({ date: -1 }).lean();
    res.json(logs);
});

module.exports = router;