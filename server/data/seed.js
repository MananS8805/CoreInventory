const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const store = require('./store');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seed() {
  if (store.products.length > 0) {
    console.log('Seed data already loaded — skipping');
    return;
  }

  // ─── Demo user ───────────────────────────────────────────────
  const passwordHash = bcrypt.hashSync('password123', 10);
  store.users.push({
    id: crypto.randomUUID(),
    name: 'Admin User',
    email: 'manansheth8805@gmail.com',
    passwordHash,
    createdAt: daysAgo(30)
  });

  // ─── Products ─────────────────────────────────────────────────
  const products = [
    { name: 'Steel Rods',      sku: 'SR-001', category: 'Metals',     unit: 'pcs',    qty_on_hand: 120, cost_price: 250, min_stock: 20, location: 'Rack A' },
    { name: 'Wooden Planks',   sku: 'WP-002', category: 'Wood',       unit: 'pcs',    qty_on_hand: 80,  cost_price: 180, min_stock: 15, location: 'Rack B' },
    { name: 'Aluminum Sheets', sku: 'AS-003', category: 'Metals',     unit: 'sheets', qty_on_hand: 0,   cost_price: 420, min_stock: 10, location: 'Rack A' },
    { name: 'Copper Wire',     sku: 'CW-004', category: 'Electrical', unit: 'rolls',  qty_on_hand: 8,   cost_price: 650, min_stock: 10, location: 'Production Floor' },
    { name: 'PVC Pipes',       sku: 'PP-005', category: 'Plumbing',   unit: 'pcs',    qty_on_hand: 200, cost_price: 95,  min_stock: 30, location: 'Dispatch Bay' },
  ].map(p => ({ id: crypto.randomUUID(), ...p, createdAt: daysAgo(20), updatedAt: daysAgo(2) }));
  store.products.push(...products);

  const [steelRods, woodenPlanks, aluminumSheets, copperWire, pvcPipes] = products;

  // ─── Receipt 1 — Done ─────────────────────────────────────────
  const rec1Ref = store.nextRef('receipt');
  store.receipts.push({
    id: crypto.randomUUID(), reference: rec1Ref, supplier: 'Metro Metals Ltd',
    status: 'Done',
    lines: [
      { product_id: steelRods.id, product_name: steelRods.name, qty: 50, received_qty: 50 },
      { product_id: woodenPlanks.id, product_name: woodenPlanks.name, qty: 30, received_qty: 30 }
    ],
    notes: 'Monthly restocking', createdAt: daysAgo(7), validatedAt: daysAgo(6)
  });
  store.moveLogs.push(
    { id: crypto.randomUUID(), date: daysAgo(6), type: 'receipt', product_id: steelRods.id, product_name: steelRods.name, product_sku: steelRods.sku, qty: 50, qty_before: 70, qty_after: 120, from_location: null, to_location: steelRods.location, reference: rec1Ref, notes: 'Receipt validated' },
    { id: crypto.randomUUID(), date: daysAgo(6), type: 'receipt', product_id: woodenPlanks.id, product_name: woodenPlanks.name, product_sku: woodenPlanks.sku, qty: 30, qty_before: 50, qty_after: 80, from_location: null, to_location: woodenPlanks.location, reference: rec1Ref, notes: 'Receipt validated' }
  );

  // ─── Receipt 2 — Done ─────────────────────────────────────────
  const rec2Ref = store.nextRef('receipt');
  store.receipts.push({
    id: crypto.randomUUID(), reference: rec2Ref, supplier: 'BuildSupply Co',
    status: 'Done',
    lines: [{ product_id: pvcPipes.id, product_name: pvcPipes.name, qty: 100, received_qty: 100 }],
    notes: 'Urgent restocking', createdAt: daysAgo(4), validatedAt: daysAgo(3)
  });
  store.moveLogs.push(
    { id: crypto.randomUUID(), date: daysAgo(3), type: 'receipt', product_id: pvcPipes.id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: 100, qty_before: 100, qty_after: 200, from_location: null, to_location: pvcPipes.location, reference: rec2Ref, notes: 'Receipt validated' }
  );

  // ─── Receipt 3 — Draft ────────────────────────────────────────
  const rec3Ref = store.nextRef('receipt');
  store.receipts.push({
    id: crypto.randomUUID(), reference: rec3Ref, supplier: 'ElectroParts India',
    status: 'Draft',
    lines: [
      { product_id: aluminumSheets.id, product_name: aluminumSheets.name, qty: 40, received_qty: 0 },
      { product_id: copperWire.id, product_name: copperWire.name, qty: 20, received_qty: 0 }
    ],
    notes: 'Pending supplier confirmation', createdAt: daysAgo(1), validatedAt: null
  });

  // ─── Delivery 1 — Done ────────────────────────────────────────
  const del1Ref = store.nextRef('delivery');
  store.deliveries.push({
    id: crypto.randomUUID(), reference: del1Ref, customer: 'Horizon Constructions',
    status: 'Done',
    lines: [
      { product_id: steelRods.id, product_name: steelRods.name, qty: 20 },
      { product_id: pvcPipes.id, product_name: pvcPipes.name, qty: 50 }
    ],
    notes: 'Site delivery', createdAt: daysAgo(5), validatedAt: daysAgo(4)
  });
  store.moveLogs.push(
    { id: crypto.randomUUID(), date: daysAgo(4), type: 'delivery', product_id: steelRods.id, product_name: steelRods.name, product_sku: steelRods.sku, qty: -20, qty_before: 140, qty_after: 120, from_location: steelRods.location, to_location: null, reference: del1Ref, notes: 'Delivery validated' },
    { id: crypto.randomUUID(), date: daysAgo(4), type: 'delivery', product_id: pvcPipes.id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: -50, qty_before: 250, qty_after: 200, from_location: pvcPipes.location, to_location: null, reference: del1Ref, notes: 'Delivery validated' }
  );

  // ─── Delivery 2 — Draft ───────────────────────────────────────
  const del2Ref = store.nextRef('delivery');
  store.deliveries.push({
    id: crypto.randomUUID(), reference: del2Ref, customer: 'Greenfield Interiors',
    status: 'Draft',
    lines: [{ product_id: woodenPlanks.id, product_name: woodenPlanks.name, qty: 25 }],
    notes: 'Awaiting dispatch clearance', createdAt: daysAgo(0), validatedAt: null
  });

  // ─── Adjustment ───────────────────────────────────────────────
  const adjId = crypto.randomUUID();
  store.adjustments.push({
    id: adjId, product_id: copperWire.id, product_name: copperWire.name,
    location: copperWire.location, qty_before: 10, qty_counted: 8, difference: -2,
    reason: 'Physical count — 2 rolls damaged', createdAt: daysAgo(2)
  });
  store.moveLogs.push(
    { id: crypto.randomUUID(), date: daysAgo(2), type: 'adjustment', product_id: copperWire.id, product_name: copperWire.name, product_sku: copperWire.sku, qty: -2, qty_before: 10, qty_after: 8, from_location: copperWire.location, to_location: copperWire.location, reference: adjId, notes: 'Physical count — 2 rolls damaged' }
  );

  console.log('✅ Seed data loaded — 5 products, 3 receipts, 2 deliveries, 1 adjustment, 1 user (admin@core.com / password123)');
}

module.exports = seed;