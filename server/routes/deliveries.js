const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const MoveLog = require('../models/MoveLog');
const Counter = require('../models/Counter');

async function nextRef(type) {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { key: type },
        { $inc: { value: 1 } },
        { returnDocument: 'after', upsert: true }
    );
    const num = String(counter.value).padStart(4, '0');
    return type === 'receipt' ? `REC/${year}/${num}` : `DEL/${year}/${num}`;
}

function checkLowStock(products) {
    return products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

router.get('/', async (req, res) => {
    const { status, customer } = req.query;
    const filter = {};
    if (status) filter.status = status.toLowerCase();
    if (customer) filter.customer = { $regex: customer, $options: 'i' };
    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 }).lean();
    res.json(deliveries);
});

router.get('/:id', async (req, res) => {
    const delivery = await Delivery.findById(req.params.id).lean();
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
});

router.post('/', async (req, res) => {
    const { customer, lines, notes } = req.body;
    if (!customer) return res.status(400).json({ error: 'Customer is required' });
    if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ error: 'At least one line is required' });
    const enrichedLines = [];
    for (const line of lines) {
        const product = await Product.findById(line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
        enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
    }
    const reference = await nextRef('delivery');
    const delivery = await Delivery.create({ reference, customer: customer.trim(), status: 'draft', lines: enrichedLines, notes: notes || '', validatedAt: null });
    res.status(201).json(delivery);
});

router.put('/:id', async (req, res) => {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done' || delivery.status === 'canceled')
        return res.status(400).json({ error: `Cannot edit a ${delivery.status} delivery` });
    const { customer, notes, lines } = req.body;
    if (customer) delivery.customer = customer.trim();
    if (notes !== undefined) delivery.notes = notes;
    if (Array.isArray(lines)) {
        const enriched = [];
        for (const line of lines) {
            const product = await Product.findById(line.product_id);
            if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
            enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
        }
        delivery.lines = enriched;
    }
    await delivery.save();
    res.json(delivery);
});

router.post('/:id/validate', async (req, res) => {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ error: 'Already validated' });
    if (delivery.status === 'canceled') return res.status(400).json({ error: 'Cannot validate canceled delivery' });
    const insufficient = [];
    for (const line of delivery.lines) {
        const product = await Product.findById(line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        if (product.qty_on_hand < line.qty) {
            insufficient.push({ product_name: product.name, required: line.qty, available: product.qty_on_hand });
        }
    }
    if (insufficient.length > 0) return res.status(400).json({ error: 'Insufficient stock', details: insufficient });
    for (const line of delivery.lines) {
        const product = await Product.findById(line.product_id);
        const qty_before = product.qty_on_hand;
        product.qty_on_hand -= line.qty;
        product.updatedAt = new Date();
        await product.save();
        await MoveLog.create({ type: 'delivery', product_id: product._id, product_name: product.name, product_sku: product.sku, qty: line.qty, qty_before, qty_after: product.qty_on_hand, from_location: product.location, to_location: null, reference: delivery.reference, notes: `Delivery validated: ${delivery.reference}` });
    }
    delivery.status = 'done';
    delivery.validatedAt = new Date();
    await delivery.save();
    const allProducts = await Product.find().lean();
    const low_stock_alerts = checkLowStock(allProducts);
    res.json({ delivery, low_stock_alerts });
});

router.post('/:id/cancel', async (req, res) => {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ error: 'Cannot cancel a done delivery' });
    if (delivery.status === 'canceled') return res.status(400).json({ error: 'Already canceled' });
    delivery.status = 'canceled';
    await delivery.save();
    res.json(delivery);
});

module.exports = router;