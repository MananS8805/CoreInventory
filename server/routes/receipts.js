const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
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
    const { status, supplier } = req.query;
    const filter = {};
    if (status) filter.status = status.toLowerCase();
    if (supplier) filter.supplier = { $regex: supplier, $options: 'i' };
    const receipts = await Receipt.find(filter).sort({ createdAt: -1 }).lean();
    res.json(receipts);
});

router.get('/:id', async (req, res) => {
    const receipt = await Receipt.findById(req.params.id).lean();
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
});

router.post('/', async (req, res) => {
    const { supplier, lines, notes } = req.body;
    if (!supplier) return res.status(400).json({ error: 'Supplier is required' });
    if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ error: 'At least one line is required' });
    const enrichedLines = [];
    for (const line of lines) {
        const product = await Product.findById(line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
        enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: 0 });
    }
    const reference = await nextRef('receipt');
    const receipt = await Receipt.create({ reference, supplier: supplier.trim(), status: 'draft', lines: enrichedLines, notes: notes || '', validatedAt: null });
    res.status(201).json(receipt);
});

router.put('/:id', async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done' || receipt.status === 'canceled')
        return res.status(400).json({ error: `Cannot edit a ${receipt.status} receipt` });
    const { supplier, notes, lines } = req.body;
    if (supplier) receipt.supplier = supplier.trim();
    if (notes !== undefined) receipt.notes = notes;
    if (Array.isArray(lines)) {
        const enriched = [];
        for (const line of lines) {
            const product = await Product.findById(line.product_id);
            if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
            enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: line.received_qty || 0 });
        }
        receipt.lines = enriched;
    }
    await receipt.save();
    res.json(receipt);
});

router.post('/:id/validate', async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ error: 'Already validated' });
    if (receipt.status === 'canceled') return res.status(400).json({ error: 'Cannot validate canceled receipt' });
    for (const line of receipt.lines) {
        const product = await Product.findById(line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        const qty_before = product.qty_on_hand;
        product.qty_on_hand += line.qty;
        product.updatedAt = new Date();
        line.received_qty = line.qty;
        await product.save();
        await MoveLog.create({ type: 'receipt', product_id: product._id, product_name: product.name, product_sku: product.sku, qty: line.qty, qty_before, qty_after: product.qty_on_hand, from_location: null, to_location: product.location, reference: receipt.reference, notes: `Receipt validated: ${receipt.reference}` });
    }
    receipt.status = 'done';
    receipt.validatedAt = new Date();
    await receipt.save();
    const allProducts = await Product.find().lean();
    const low_stock_alerts = checkLowStock(allProducts);
    res.json({ receipt, low_stock_alerts });
});

router.post('/:id/cancel', async (req, res) => {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ error: 'Cannot cancel a done receipt' });
    if (receipt.status === 'canceled') return res.status(400).json({ error: 'Already canceled' });
    receipt.status = 'canceled';
    await receipt.save();
    res.json(receipt);
});

module.exports = router;