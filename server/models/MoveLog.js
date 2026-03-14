const mongoose = require('mongoose');

const moveLogSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: { type: String, required: true },
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    product_sku: { type: String, required: true },
    qty: { type: Number, required: true },
    qty_before: { type: Number, required: true },
    qty_after: { type: Number, required: true },
    from_location: { type: String, default: null },
    to_location: { type: String, default: null },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
});

module.exports = mongoose.model('MoveLog', moveLogSchema);