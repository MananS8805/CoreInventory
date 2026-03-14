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

  // ── Demo user ─────────────────────────────────────────────────
  const passwordHash = bcrypt.hashSync('password123', 10);
  store.pushUser({
    id: crypto.randomUUID(),
    clerkId: 'user_2abc123def456', // Placeholder Clerk ID - will be updated on first login
    name: 'Admin User',
    email: 'manansheth8805@gmail.com',
    passwordHash,
    createdAt: daysAgo(30)
  });

  // ── Products ──────────────────────────────────────────────────
  const productDefs = [
    { name: 'Steel Rods', sku: 'SR-001', category: 'Metals', unit: 'pcs', cost_price: 250, min_stock: 20 },
    { name: 'Wooden Planks', sku: 'WP-002', category: 'Wood', unit: 'pcs', cost_price: 180, min_stock: 15 },
    { name: 'Aluminum Sheets', sku: 'AS-003', category: 'Metals', unit: 'sheets', cost_price: 420, min_stock: 10 },
    { name: 'Copper Wire', sku: 'CW-004', category: 'Electrical', unit: 'rolls', cost_price: 650, min_stock: 10 },
    { name: 'PVC Pipes', sku: 'PP-005', category: 'Plumbing', unit: 'pcs', cost_price: 95, min_stock: 30 },
  ];

  const products = [
    {
      id: crypto.randomUUID(),
      name: 'Steel Rods', sku: 'SR-001', category: 'Metals', unit: 'pcs', cost_price: 250, min_stock: 20,
      stock_by_location: { 'Main Warehouse: Rack A': 120 },
      createdAt: daysAgo(20), updatedAt: daysAgo(2)
    },
    {
      id: crypto.randomUUID(),
      name: 'Wooden Planks', sku: 'WP-002', category: 'Wood', unit: 'pcs', cost_price: 180, min_stock: 15,
      stock_by_location: { 'Main Warehouse: Rack B': 80 },
      createdAt: daysAgo(20), updatedAt: daysAgo(2)
    },
    {
      id: crypto.randomUUID(),
      name: 'Aluminum Sheets', sku: 'AS-003', category: 'Metals', unit: 'sheets', cost_price: 420, min_stock: 10,
      stock_by_location: { 'Main Warehouse: Rack A': 0 },
      createdAt: daysAgo(20), updatedAt: daysAgo(2)
    },
    {
      id: crypto.randomUUID(),
      name: 'Copper Wire', sku: 'CW-004', category: 'Electrical', unit: 'rolls', cost_price: 650, min_stock: 10,
      stock_by_location: { 'Main Warehouse: Production Floor': 8 },
      createdAt: daysAgo(20), updatedAt: daysAgo(2)
    },
    {
      id: crypto.randomUUID(),
      name: 'PVC Pipes', sku: 'PP-005', category: 'Plumbing', unit: 'pcs', cost_price: 95, min_stock: 30,
      stock_by_location: { 'Main Warehouse: Dispatch Bay': 200 },
      createdAt: daysAgo(20), updatedAt: daysAgo(2)
    }
  ];

  products.forEach(p => store.pushProduct(p));

  const [steelRods, woodenPlanks, aluminumSheets, copperWire, pvcPipes] = products;

  // ── Receipt 1 — done ─────────────────────────────────────────
  const rec1Ref = store.nextRef('receipt');
  store.pushReceipt({
    id: crypto.randomUUID(),
    reference: rec1Ref,
    supplier: 'Metro Metals Ltd',
    warehouse: 'Main Warehouse',
    status: 'done',
    lines: [
      { product_id: steelRods.id, product_name: steelRods.name, qty: 50, received_qty: 50 },
      { product_id: woodenPlanks.id, product_name: woodenPlanks.name, qty: 30, received_qty: 30 }
    ],
    notes: 'Monthly restocking',
    createdAt: daysAgo(7),
    validatedAt: daysAgo(6)
  });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(6), type: 'receipt', product_id: steelRods.id, product_name: steelRods.name, product_sku: steelRods.sku, qty: 50, qty_before: 70, qty_after: 120, from_location: null, to_location: 'Main Warehouse: Rack A', reference: rec1Ref, notes: 'Receipt validated' });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(6), type: 'receipt', product_id: woodenPlanks.id, product_name: woodenPlanks.name, product_sku: woodenPlanks.sku, qty: 30, qty_before: 50, qty_after: 80, from_location: null, to_location: 'Main Warehouse: Rack B', reference: rec1Ref, notes: 'Receipt validated' });

  // ── Receipt 2 — done ─────────────────────────────────────────
  const rec2Ref = store.nextRef('receipt');
  store.pushReceipt({
    id: crypto.randomUUID(),
    reference: rec2Ref,
    supplier: 'BuildSupply Co',
    warehouse: 'Main Warehouse',
    status: 'done',
    lines: [
      { product_id: pvcPipes.id, product_name: pvcPipes.name, qty: 100, received_qty: 100 }
    ],
    notes: 'Urgent restocking',
    createdAt: daysAgo(4),
    validatedAt: daysAgo(3)
  });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(3), type: 'receipt', product_id: pvcPipes.id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: 100, qty_before: 100, qty_after: 200, from_location: null, to_location: 'Main Warehouse: Dispatch Bay', reference: rec2Ref, notes: 'Receipt validated' });

  // ── Receipt 3 — draft ─────────────────────────────────────────
  const rec3Ref = store.nextRef('receipt');
  store.pushReceipt({
    id: crypto.randomUUID(),
    reference: rec3Ref,
    supplier: 'ElectroParts India',
    warehouse: 'Main Warehouse',
    status: 'draft',
    lines: [
      { product_id: aluminumSheets.id, product_name: aluminumSheets.name, qty: 40, received_qty: 0 },
      { product_id: copperWire.id, product_name: copperWire.name, qty: 20, received_qty: 0 }
    ],
    notes: 'Pending supplier confirmation',
    createdAt: daysAgo(1),
    validatedAt: null
  });

  // ── Delivery 1 — done ─────────────────────────────────────────
  const del1Ref = store.nextRef('delivery');
  store.pushDelivery({
    id: crypto.randomUUID(),
    reference: del1Ref,
    customer: 'Horizon Constructions',
    warehouse: 'Main Warehouse',
    status: 'done',
    lines: [
      { product_id: steelRods.id, product_name: steelRods.name, qty: 20 },
      { product_id: pvcPipes.id, product_name: pvcPipes.name, qty: 50 }
    ],
    notes: 'Site delivery',
    createdAt: daysAgo(5),
    validatedAt: daysAgo(4)
  });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(4), type: 'delivery', product_id: steelRods.id, product_name: steelRods.name, product_sku: steelRods.sku, qty: 20, qty_before: 140, qty_after: 120, from_location: 'Main Warehouse: Rack A', to_location: null, reference: del1Ref, notes: 'Delivery validated' });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(4), type: 'delivery', product_id: pvcPipes.id, product_name: pvcPipes.name, product_sku: pvcPipes.sku, qty: 50, qty_before: 250, qty_after: 200, from_location: 'Main Warehouse: Dispatch Bay', to_location: null, reference: del1Ref, notes: 'Delivery validated' });

  // ── Delivery 2 — draft ────────────────────────────────────────
  const del2Ref = store.nextRef('delivery');
  store.pushDelivery({
    id: crypto.randomUUID(),
    reference: del2Ref,
    customer: 'Greenfield Interiors',
    warehouse: 'Main Warehouse',
    status: 'draft',
    lines: [
      { product_id: woodenPlanks.id, product_name: woodenPlanks.name, qty: 25 }
    ],
    notes: 'Awaiting dispatch clearance',
    createdAt: daysAgo(0),
    validatedAt: null
  });

  // ── Adjustment ────────────────────────────────────────────────
  const adjId = crypto.randomUUID();
  store.pushAdjustment({
    id: adjId,
    product_id: copperWire.id,
    product_name: copperWire.name,
    location: 'Main Warehouse: Production Floor',
    qty_before: 10,
    qty_counted: 8,
    difference: -2,
    reason: 'Physical count — 2 rolls damaged',
    createdAt: daysAgo(2)
  });
  store.pushMoveLog({ id: crypto.randomUUID(), date: daysAgo(2), type: 'adjustment', product_id: copperWire.id, product_name: copperWire.name, product_sku: copperWire.sku, qty: 2, qty_before: 10, qty_after: 8, from_location: 'Main Warehouse: Production Floor', to_location: 'Main Warehouse: Production Floor', reference: adjId, notes: 'Physical count — 2 rolls damaged' });

  console.log('✅ Seed data loaded — 5 products, 3 receipts, 2 deliveries, 1 adjustment');
}

module.exports = seed;