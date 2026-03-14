const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');
const { getTotalStock } = require('../utils/ledger');

function checkLowStock() {
    return store.products.filter(p => getTotalStock(p) <= p.min_stock && getTotalStock(p) > 0);
}

router.get('/', (req, res) => {
    const { status, customer } = req.query;
    let results = [...store.deliveries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (status) results = results.filter(d => d.status.toLowerCase() === status.toLowerCase());
    if (customer) results = results.filter(d => d.customer.toLowerCase().includes(customer.toLowerCase()));
    res.json(results);
});

router.get('/:id', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
});

router.post('/', (req, res) => {
    const { customer, lines, notes, warehouse } = req.body;
    if (!customer) return res.status(400).json({ error: 'Customer is required' });
    if (!Array.isArray(lines) || lines.length === 0)
        return res.status(400).json({ error: 'At least one line is required' });
    const enrichedLines = [];
    for (const line of lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
        enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
    }
    const delivery = {
        id: crypto.randomUUID(),
        reference: store.nextRef('delivery'),
        customer: customer.trim(),
        warehouse: warehouse || 'Main Warehouse',
        status: 'draft',
        lines: enrichedLines,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        validatedAt: null
    };
    store.pushDelivery(delivery);
    res.status(201).json(delivery);
});

router.put('/:id', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done' || delivery.status === 'canceled')
        return res.status(400).json({ error: `Cannot edit a ${delivery.status} delivery` });
    const { customer, notes, lines, warehouse } = req.body;
    const updates = { ...delivery };
    if (customer) updates.customer = customer.trim();
    if (warehouse) updates.warehouse = warehouse.trim();
    if (notes !== undefined) updates.notes = notes;
    if (Array.isArray(lines)) {
        const enriched = [];
        for (const line of lines) {
            const product = store.products.find(p => p.id === line.product_id);
            if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
            enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty });
        }
        updates.lines = enriched;
    }
    store.updateDelivery(req.params.id, updates);
    res.json(updates);
});

router.post('/:id/validate', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ error: 'Already validated' });
    if (delivery.status === 'canceled') return res.status(400).json({ error: 'Cannot validate canceled delivery' });

    const insufficient = [];
    for (const line of delivery.lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        const totalStock = getTotalStock(product);
        if (totalStock < line.qty)
            insufficient.push({ product_name: product.name, required: line.qty, available: totalStock });
    }
    if (insufficient.length > 0)
        return res.status(400).json({ error: 'Insufficient stock', details: insufficient });

    for (const line of delivery.lines) {
        const product = store.products.find(p => p.id === line.product_id);

        // Initialize stock_by_location if it doesn't exist
        if (!product.stock_by_location) {
            product.stock_by_location = {};
        }

        const warehouseLocation = `${delivery.warehouse}: Default`;
        const qty_before = product.stock_by_location[warehouseLocation] || 0;
        const qty_after = qty_before - line.qty;

        // Update stock in the specific warehouse location
        product.stock_by_location[warehouseLocation] = qty_after;
        store.updateProduct(line.product_id, {
            stock_by_location: product.stock_by_location,
            updatedAt: new Date().toISOString()
        });

        store.pushMoveLog({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: 'delivery',
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            qty: line.qty,
            qty_before,
            qty_after,
            from_location: warehouseLocation,
            to_location: null,
            reference: delivery.reference,
            notes: `Delivery validated: ${delivery.reference}`
        });
    }

    store.updateDelivery(delivery.id, {
        ...delivery,
        status: 'done',
        validatedAt: new Date().toISOString()
    });

    const updated = store.deliveries.find(d => d.id === delivery.id);
    const low_stock_alerts = checkLowStock();
    res.json({ delivery: updated, low_stock_alerts });
});

router.post('/:id/cancel', (req, res) => {
    const delivery = store.deliveries.find(d => d.id === req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ error: 'Cannot cancel a done delivery' });
    if (delivery.status === 'canceled') return res.status(400).json({ error: 'Already canceled' });
    store.updateDelivery(delivery.id, { ...delivery, status: 'canceled' });
    res.json({ ...delivery, status: 'canceled' });
});

module.exports = router;