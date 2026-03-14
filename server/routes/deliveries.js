const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');

// ── Helper: low stock check ──────────────────────────────────────────────────
function checkLowStock() {
    return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

// ── GET /api/deliveries ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
    const { status, customer } = req.query;
    let results = [...store.deliveries];

    if (status) {
        results = results.filter(d => d.status.toLowerCase() === status.toLowerCase());
    }
    if (customer) {
        results = results.filter(d =>
            d.customer.toLowerCase().includes(customer.toLowerCase())
        );
    }

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(results);
});

// ── GET /api/deliveries/:id ──────────────────────────────────────────────────
router.get('/:id', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
});

// ── POST /api/deliveries ─────────────────────────────────────────────────────
router.post('/', (req, res) => {
    const { customer, lines, notes } = req.body;

    if (!customer || !customer.trim()) {
        return res.status(400).json({ error: 'Customer is required' });
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
            qty: line.qty
        });
    }

    const delivery = {
        id: crypto.randomUUID(),
        reference: store.nextRef('delivery'),
        customer: customer.trim(),
        status: 'Draft',
        lines: enrichedLines,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        validatedAt: null
    };

    store.deliveries.push(delivery);
    res.status(201).json(delivery);
});

// ── PUT /api/deliveries/:id ──────────────────────────────────────────────────
router.put('/:id', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    if (delivery.status === 'Done' || delivery.status === 'Canceled') {
        return res.status(400).json({
            error: `Cannot edit a delivery with status: ${delivery.status}`
        });
    }

    const { customer, notes, status, lines } = req.body;

    if (customer) delivery.customer = customer.trim();
    if (notes !== undefined) delivery.notes = notes;
    if (status) delivery.status = status;

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
                qty: line.qty
            });
        }
        delivery.lines = enrichedLines;
    }

    res.json(delivery);
});

// ── POST /api/deliveries/:id/validate ────────────────────────────────────────
router.post('/:id/validate', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    if (delivery.status === 'Done') {
        return res.status(400).json({ error: 'Delivery is already validated' });
    }
    if (delivery.status === 'Canceled') {
        return res.status(400).json({ error: 'Cannot validate a canceled delivery' });
    }

    // ── STOCK CHECK FIRST — do not touch any qty until all lines are verified ──
    const insufficientItems = [];
    for (const line of delivery.lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) {
            return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        }
        if (product.qty_on_hand < line.qty) {
            insufficientItems.push({
                product_name: product.name,
                product_sku: product.sku,
                required: line.qty,
                available: product.qty_on_hand
            });
        }
    }

    // If any product has insufficient stock — reject the whole delivery
    if (insufficientItems.length > 0) {
        return res.status(400).json({
            error: 'Insufficient stock for one or more products',
            details: insufficientItems
        });
    }

    // ── ALL STOCK OK — now decrease qty and create MoveLogs ──────────────────
    for (const line of delivery.lines) {
        const product = store.products.find(p => p.id === line.product_id);

        const qty_before = product.qty_on_hand;
        product.qty_on_hand -= line.qty;
        product.updatedAt = new Date().toISOString();

        // Create MoveLog entry
        store.moveLogs.push({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: 'delivery',
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            qty: -line.qty,
            qty_before,
            qty_after: product.qty_on_hand,
            from_location: product.location,
            to_location: null,
            reference: delivery.reference,
            notes: `Delivery validated: ${delivery.reference}`
        });
    }

    // Mark delivery as Done
    delivery.status = 'Done';
    delivery.validatedAt = new Date().toISOString();

    // Check low stock after validation
    const low_stock_alerts = checkLowStock();

    res.json({ delivery, low_stock_alerts });
});

// ── POST /api/deliveries/:id/cancel ──────────────────────────────────────────
router.post('/:id/cancel', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    if (delivery.status === 'Done') {
        return res.status(400).json({ error: 'Cannot cancel a delivery that is already Done' });
    }
    if (delivery.status === 'Canceled') {
        return res.status(400).json({ error: 'Delivery is already canceled' });
    }

    delivery.status = 'Canceled';
    res.json(delivery);
});

module.exports = router;