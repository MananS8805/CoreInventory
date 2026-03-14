const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    qty: { type: Number, required: true },
    received_qty: { type: Number, default: 0 },
}, { _id: false });

const receiptSchema = new mongoose.Schema({
    reference: { type: String },
    supplier: { type: String, required: true },
    status: { type: String, default: 'draft' },
    lines: [lineSchema],
    notes: { type: String, default: '' },
    validatedAt: { type: Date, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('Receipt', receiptSchema);