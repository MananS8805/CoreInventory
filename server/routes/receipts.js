const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

// ── Helper: low stock check ──────────────────────────────────────────────────
function checkLowStock() {
    return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

// ── GET /api/receipts ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    const { status, supplier } = req.query;
    let results = [...store.receipts];

    if (status) {
        results = results.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    if (supplier) {
        results = results.filter(r =>
            r.supplier.toLowerCase().includes(supplier.toLowerCase())
        );
    }

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(results);
});

// ── GET /api/receipts/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
});

// ── POST /api/receipts ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
    const { supplier, lines, notes } = req.body;

    if (!supplier || !supplier.trim()) {
        return res.status(400).json({ error: 'Supplier is required' });
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: 'At least one product line is required' });
    }

    // Enrich lines with product_name
    const enrichedLines = [];
    for (const line of lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) {
            return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        }
        if (!line.qty || line.qty <= 0) {
            return res.status(400).json({ error: `Invalid quantity for product: ${product.name}` });
        }
        enrichedLines.push({
            product_id: line.product_id,
            product_name: product.name,
            qty: line.qty,
            received_qty: 0
        });
    }

    const receipt = {
        id: crypto.randomUUID(),
        reference: store.nextRef('receipt'),
        supplier: supplier.trim(),
        status: 'Draft',
        lines: enrichedLines,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        validatedAt: null
    };

    store.receipts.push(receipt);
    res.status(201).json(receipt);
});

// ── PUT /api/receipts/:id ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status === 'Done' || receipt.status === 'Canceled') {
        return res.status(400).json({
            error: `Cannot edit a receipt with status: ${receipt.status}`
        });
    }

    const { supplier, notes, status, lines } = req.body;

    if (supplier) receipt.supplier = supplier.trim();
    if (notes !== undefined) receipt.notes = notes;
    if (status) receipt.status = status;

    if (lines && Array.isArray(lines)) {
        const enrichedLines = [];
        for (const line of lines) {
            const product = store.products.find(p => p.id === line.product_id);
            if (!product) {
                return res.status(400).json({ error: `Product not found: ${line.product_id}` });
            }
            enrichedLines.push({
                product_id: line.product_id,
                product_name: product.name,
                qty: line.qty,
                received_qty: line.received_qty || 0
            });
        }
        receipt.lines = enrichedLines;
    }

    res.json(receipt);
});

// ── POST /api/receipts/:id/validate ─────────────────────────────────────────
router.post('/:id/validate', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status === 'Done') {
        return res.status(400).json({ error: 'Receipt is already validated' });
    }
    if (receipt.status === 'Canceled') {
        return res.status(400).json({ error: 'Cannot validate a canceled receipt' });
    }

    // Process each line — increase stock + create MoveLog
    for (const line of receipt.lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) {
            return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        }

        const qty_before = product.qty_on_hand;
        product.qty_on_hand += line.qty;
        product.updatedAt = new Date().toISOString();
        line.received_qty = line.qty;

        // Create MoveLog entry
        store.moveLogs.push({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: 'receipt',
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            qty: line.qty,
            qty_before,
            qty_after: product.qty_on_hand,
            from_location: null,
            to_location: product.location,
            reference: receipt.reference,
            notes: `Receipt validated: ${receipt.reference}`
        });
    }

    // Mark receipt as Done
    receipt.status = 'Done';
    receipt.validatedAt = new Date().toISOString();

    // Check low stock after validation
    const low_stock_alerts = checkLowStock();

    res.json({ receipt, low_stock_alerts });
});

// ── POST /api/receipts/:id/cancel ────────────────────────────────────────────
router.post('/:id/cancel', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status === 'Done') {
        return res.status(400).json({ error: 'Cannot cancel a receipt that is already Done' });
    }
    if (receipt.status === 'Canceled') {
        return res.status(400).json({ error: 'Receipt is already canceled' });
    }

    receipt.status = 'Canceled';
    res.json(receipt);
});

module.exports = router;