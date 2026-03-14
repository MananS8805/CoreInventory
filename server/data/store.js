const crypto = require('crypto');

const store = {
  users: [],
  products: [],
  receipts: [],
  deliveries: [],
  moveLogs: [],
  adjustments: [],
  warehouses: [
    {
      id: crypto.randomUUID(),
      name: "Main Warehouse",
      short_code: "MW",
      address: "123 Industrial Area",
      locations: ["Rack A", "Rack B", "Production Floor", "Dispatch Bay"]
    }
  ],
  counters: { receipt: 0, delivery: 0 }
};

// Helper: generate reference numbers
store.nextRef = (type) => {
  store.counters[type]++;
  const year = new Date().getFullYear();
  const num = String(store.counters[type]).padStart(4, '0');
  return type === 'receipt' ? `REC/${year}/${num}` : `DEL/${year}/${num}`;
};

module.exports = store;
