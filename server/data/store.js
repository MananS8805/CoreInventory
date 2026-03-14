const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const crypto = require('crypto');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Set defaults — only written if db.json is empty
db.defaults({
  users: [],
  products: [],
  receipts: [],
  deliveries: [],
  moveLogs: [],
  adjustments: [],
  transfers: [],
  warehouses: [
    {
      id: crypto.randomUUID(),
      name: 'Main Warehouse',
      short_code: 'MW',
      address: '123 Industrial Area',
      locations: ['Rack A', 'Rack B', 'Production Floor', 'Dispatch Bay']
    }
  ],
  counters: { receipt: 0, delivery: 0 }
}).write();

const store = {
  get users() { return db.get('users').value(); },
  get products() { return db.get('products').value(); },
  get receipts() { return db.get('receipts').value(); },
  get deliveries() { return db.get('deliveries').value(); },
  get moveLogs() { return db.get('moveLogs').value(); },
  get adjustments() { return db.get('adjustments').value(); },
  get transfers() { return db.get('transfers').value(); },
  get warehouses() { return db.get('warehouses').value(); },

  // Push helpers — write to file immediately
  pushUser: (item) => { db.get('users').push(item).write(); },
  pushProduct: (item) => { db.get('products').push(item).write(); },
  pushReceipt: (item) => { db.get('receipts').push(item).write(); },
  pushDelivery: (item) => { db.get('deliveries').push(item).write(); },
  pushMoveLog: (item) => { db.get('moveLogs').push(item).write(); },
  pushAdjustment: (item) => { db.get('adjustments').push(item).write(); },
  pushTransfer: (item) => { db.get('transfers').push(item).write(); },
  pushWarehouse: (item) => { db.get('warehouses').push(item).write(); },

  // Update helpers
  updateProduct: (id, changes) => {
    db.get('products').find({ id }).assign(changes).write();
  },
  updateReceipt: (id, changes) => {
    db.get('receipts').find({ id }).assign(changes).write();
  },
  updateDelivery: (id, changes) => {
    db.get('deliveries').find({ id }).assign(changes).write();
  },
  updateWarehouse: (id, changes) => {
    db.get('warehouses').find({ id }).assign(changes).write();
  },
  updateUser: (id, changes) => {
    db.get('users').find({ id }).assign(changes).write();
  },
  removeProduct: (id) => {
    db.get('products').remove({ id }).write();
  },

  // Counter helper
  nextRef: (type) => {
    const current = db.get(`counters.${type}`).value();
    const next = current + 1;
    db.set(`counters.${type}`, next).write();
    const year = new Date().getFullYear();
    const num = String(next).padStart(4, '0');
    return type === 'receipt' ? `REC/${year}/${num}` : `DEL/${year}/${num}`;
  }
};

module.exports = store;