const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../data/store');
const { getTotalStock } = require('../utils/ledger');

function checkLowStock() {
    return store.products.filter(p => getTotalStock(p) <= p.min_stock && getTotalStock(p) > 0);
}

router.get('/', (req, res) => {
    const { status, supplier } = req.query;
    let results = [...store.receipts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (status) results = results.filter(r => r.status.toLowerCase() === status.toLowerCase());
    if (supplier) results = results.filter(r => r.supplier.toLowerCase().includes(supplier.toLowerCase()));
    res.json(results);
});

router.get('/:id', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
});

router.post('/', (req, res) => {
    const { supplier, lines, notes, warehouse } = req.body;
    if (!supplier) return res.status(400).json({ error: 'Supplier is required' });
    if (!Array.isArray(lines) || lines.length === 0)
        return res.status(400).json({ error: 'At least one line is required' });
    const enrichedLines = [];
    for (const line of lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
        if (!line.qty || line.qty <= 0) return res.status(400).json({ error: `Invalid qty for ${product.name}` });
        enrichedLines.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: 0 });
    }
    const receipt = {
        id: crypto.randomUUID(),
        reference: store.nextRef('receipt'),
        supplier: supplier.trim(),
        warehouse: warehouse || 'Main Warehouse',
        status: 'draft',
        lines: enrichedLines,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        validatedAt: null
    };
    store.pushReceipt(receipt);
    res.status(201).json(receipt);
});

router.put('/:id', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done' || receipt.status === 'canceled')
        return res.status(400).json({ error: `Cannot edit a ${receipt.status} receipt` });
    const { supplier, notes, lines, warehouse } = req.body;
    const updates = { ...receipt };
    if (supplier) updates.supplier = supplier.trim();
    if (warehouse) updates.warehouse = warehouse.trim();
    if (notes !== undefined) updates.notes = notes;
    if (Array.isArray(lines)) {
        const enriched = [];
        for (const line of lines) {
            const product = store.products.find(p => p.id === line.product_id);
            if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });
            enriched.push({ product_id: line.product_id, product_name: product.name, qty: line.qty, received_qty: line.received_qty || 0 });
        }
        updates.lines = enriched;
    }
    store.updateReceipt(req.params.id, updates);
    res.json(updates);
});

router.post('/:id/validate', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ error: 'Already validated' });
    if (receipt.status === 'canceled') return res.status(400).json({ error: 'Cannot validate canceled receipt' });

    for (const line of receipt.lines) {
        const product = store.products.find(p => p.id === line.product_id);
        if (!product) return res.status(400).json({ error: `Product not found: ${line.product_id}` });

        // Initialize stock_by_location if it doesn't exist
        if (!product.stock_by_location) {
            product.stock_by_location = {};
        }

        const warehouseLocation = `${receipt.warehouse}: Default`;
        const qty_before = product.stock_by_location[warehouseLocation] || 0;
        const qty_after = qty_before + line.qty;

        // Update stock in the specific warehouse location
        product.stock_by_location[warehouseLocation] = qty_after;
        store.updateProduct(line.product_id, {
            stock_by_location: product.stock_by_location,
            updatedAt: new Date().toISOString()
        });

        line.received_qty = line.qty;
        store.pushMoveLog({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: 'receipt',
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            qty: line.qty,
            qty_before,
            qty_after,
            from_location: null,
            to_location: warehouseLocation,
            reference: receipt.reference,
            notes: `Receipt validated: ${receipt.reference}`
        });
    }

    store.updateReceipt(receipt.id, {
        ...receipt,
        status: 'done',
        validatedAt: new Date().toISOString(),
        lines: receipt.lines
    });

    const updated = store.receipts.find(r => r.id === receipt.id);
    const low_stock_alerts = checkLowStock();
    res.json({ receipt: updated, low_stock_alerts });
});

router.post('/:id/cancel', (req, res) => {
    const receipt = store.receipts.find(r => r.id === req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ error: 'Cannot cancel a done receipt' });
    if (receipt.status === 'canceled') return res.status(400).json({ error: 'Already canceled' });
    store.updateReceipt(receipt.id, { ...receipt, status: 'canceled' });
    res.json({ ...receipt, status: 'canceled' });
});

module.exports = router;