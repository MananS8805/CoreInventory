const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    short_code: { type: String, required: true },
    address: { type: String, default: '' },
    locations: [{ type: String }],
});

module.exports = mongoose.model('Warehouse', warehouseSchema);