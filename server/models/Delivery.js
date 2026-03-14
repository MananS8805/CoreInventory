const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    qty: { type: Number, required: true },
}, { _id: false });

const deliverySchema = new mongoose.Schema({
    reference: { type: String },
    customer: { type: String, required: true },
    status: { type: String, default: 'draft' },
    lines: [lineSchema],
    notes: { type: String, default: '' },
    validatedAt: { type: Date, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('Delivery', deliverySchema);