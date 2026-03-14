const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, default: '' },
    unit: { type: String, default: 'pcs' },
    qty_on_hand: { type: Number, default: 0 },
    cost_price: { type: Number, default: 0 },
    min_stock: { type: Number, default: 0 },
    location: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Product', productSchema);