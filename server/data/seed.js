const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const MoveLog = require('../models/MoveLog');
const Adjustment = require('../models/Adjustment');
const Warehouse = require('../models/Warehouse');
const Counter = require('../models/Counter');

async function nextRef(type) {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { key: type },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );
    const num = String(counter.value).padStart(4, '0');
    return type === 'receipt' ? `REC/${year}/${num}` : `DEL/${year}/${num}`;
}

async function seed() {
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
        console.log('Seed data already exists — skipping');
        return;
    }

    // Warehouse
    await Warehouse.create({ name: 'Main Warehouse', short_code: 'MW', address: '123 Industrial Area', locations: ['Rack A', 'Rack B', 'Production Floor', 'Dispatch Bay'] });

    // Products
    const productDefs = [
        { name: 'Steel Rods', sku: 'SR-001', category: 'Metals', unit: 'pcs', qty_on_hand: 120, cost_price: 250, min_stock: 20, location: 'Rack A' },
        { name: 'Wooden Planks', sku: 'WP-002', category: 'Wood', unit: 'pcs', qty_on_hand: 80, cost_price: 180, min_stock: 15, location: 'Rack B' },
        { name: 'Aluminum Sheets', sku: 'AS-003', category: 'Metals', unit: 'sheets', qty_on_hand: 0, cost_price: 420, min_stock: 10, location: 'Rack A' },
        { name: 'Copper Wire', sku: 'CW-004', category: 'Electrical', unit: 'rolls', qty_on_hand: 8, cost_price: 650, min_stock: 10, location: 'Production Floor' },
        { name: 'PVC Pipes', sku: 'PP-005', category: 'Plumbing', unit: 'pcs', qty_on_hand: 200, cost_price: 95, min_stock: 30, location: 'Dispatch Bay' },
    ];
    const products = await Product.insertMany(productDefs);
    const [steelRods, woodenPlanks, aluminumSheets, copperWire, pvcPipes] = products;

    // Receipt 1 — done
    const rec1Ref = await nextRef('receipt');
    const receipt1 = await Receipt.create({ reference: rec1Ref, supplier: 'Metro Metals Ltd', status: 'done', lines: [{ product_id: steelRods._id, product_name: steelRods.name, qty: 50, received_qty: 50 }, { product_id: woodenPlanks._id, product_name: woodenPlanks.name, qty: 30, received_qty: 30 }], notes: 'Monthly restocking', validatedAt: new Date() });
    await MoveLog.create({ type: 'receipt', product_id: steelRods._id, product_name: steelRods.name, product_sku: steelRods.sku, qty: 50, qty_before: 70, qty_after: 120, from_location: null, to_location: steelRods.location, reference: rec1Ref, notes: 'Receipt validated' });
    await MoveLog.create({ type: 'receipt', product_id: woodenPlanks._id, product_name: woodenPlanks.name, product_sku: woodenPlanks.sku, qty: 30, qty_before: 50, qty_after: 80, from_location: null, to_location: woodenPlanks.location, reference: rec1Ref, notes: 'Receipt validated' });

    // Receipt 2 — done
    const rec2Ref = await nextRef('receipt');
    await Receipt.create({ reference: rec2Ref, supplier: 'BuildSupply Co', status: 'done', lines: [{ product_id: pvcPipes._id, product_name: pvcPipes.name, qty: 100, received_qty: 100 }], notes: 'Urgent order', validatedAt: new Date() });
    await MoveLog.create({ type: 'receipt', product_id: pvcPipes._id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: 100, qty_before: 100, qty_after: 200, from_location: null, to_location: pvcPipes.location, reference: rec2Ref, notes: 'Receipt validated' });

    // Receipt 3 — draft
    const rec3Ref = await nextRef('receipt');
    await Receipt.create({ reference: rec3Ref, supplier: 'ElectroParts India', status: 'draft', lines: [{ product_id: aluminumSheets._id, product_name: aluminumSheets.name, qty: 40, received_qty: 0 }, { product_id: copperWire._id, product_name: copperWire.name, qty: 20, received_qty: 0 }], notes: 'Pending supplier confirmation', validatedAt: null });

    // Delivery 1 — done
    const del1Ref = await nextRef('delivery');
    await Delivery.create({ reference: del1Ref, customer: 'Horizon Constructions', status: 'done', lines: [{ product_id: steelRods._id, product_name: steelRods.name, qty: 20 }, { product_id: pvcPipes._id, product_name: pvcPipes.name, qty: 50 }], notes: 'Site delivery', validatedAt: new Date() });
    await MoveLog.create({ type: 'delivery', product_id: steelRods._id, product_name: steelRods.name, product_sku: steelRods.sku, qty: 20, qty_before: 140, qty_after: 120, from_location: steelRods.location, to_location: null, reference: del1Ref, notes: 'Delivery validated' });
    await MoveLog.create({ type: 'delivery', product_id: pvcPipes._id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: 50, qty_before: 250, qty_after: 200, from_location: pvcPipes.location, to_location: null, reference: del1Ref, notes: 'Delivery validated' });

    // Delivery 2 — draft
    const del2Ref = await nextRef('delivery');
    await Delivery.create({ reference: del2Ref, customer: 'Greenfield Interiors', status: 'draft', lines: [{ product_id: woodenPlanks._id, product_name: woodenPlanks.name, qty: 25 }], notes: 'Awaiting dispatch clearance', validatedAt: null });

    // Adjustment
    const adj = await Adjustment.create({ product_id: copperWire._id, product_name: copperWire.name, location: copperWire.location, qty_before: 10, qty_counted: 8, difference: -2, reason: 'Physical count — 2 rolls damaged' });
    await MoveLog.create({ type: 'adjustment', product_id: copperWire._id, product_name: copperWire.name, product_sku: copperWire.sku, qty: 2, qty_before: 10, qty_after: 8, from_location: copperWire.location, to_location: copperWire.location, reference: adj._id.toString(), notes: adj.reason });

    console.log('✅ Seed data loaded — 5 products, 3 receipts, 2 deliveries, 1 adjustment');
}

module.exports = seed;