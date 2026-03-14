const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    location: { type: String, default: '' },
    qty_before: { type: Number, required: true },
    qty_counted: { type: Number, required: true },
    difference: { type: Number, required: true },
    reason: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('Adjustment', adjustmentSchema);