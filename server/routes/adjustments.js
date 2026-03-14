const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const MoveLog = require('../models/MoveLog');
const Adjustment = require('../models/Adjustment');

function checkLowStock(products) {
    return products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

router.get('/', async (req, res) => {
    const adjustments = await Adjustment.find().sort({ createdAt: -1 }).lean();
    res.json(adjustments);
});

router.post('/', async (req, res) => {
    const { product_id, location, qty_counted, reason } = req.body;
    if (!product_id || qty_counted === undefined)
        return res.status(400).json({ error: 'product_id and qty_counted are required' });
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const qty_before = product.qty_on_hand;
    const difference = qty_counted - qty_before;
    product.qty_on_hand = qty_counted;
    product.updatedAt = new Date();
    await product.save();
    const adjustment = await Adjustment.create({ product_id, product_name: product.name, location: location || product.location, qty_before, qty_counted, difference, reason: reason || '' });
    await MoveLog.create({ type: 'adjustment', product_id, product_name: product.name, product_sku: product.sku, qty: Math.abs(difference), qty_before, qty_after: qty_counted, from_location: product.location, to_location: product.location, reference: adjustment._id.toString(), notes: reason || 'Stock adjustment' });
    const allProducts = await Product.find().lean();
    const low_stock_alerts = checkLowStock(allProducts);
    res.status(201).json({ adjustment, low_stock_alerts });
});

module.exports = router;