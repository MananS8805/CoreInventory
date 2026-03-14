// Full integration test
async function test() {
  const BASE = 'http://localhost:5000/api';
  let token, productId, receiptId, deliveryId;
  let passed = 0, failed = 0;

  function assert(label, cond, val) {
    if (cond) { console.log(`  ✅ ${label}`); passed++; }
    else { console.log(`  ❌ ${label}:`, JSON.stringify(val)); failed++; }
  }

  try {
    // 1. Auth
    console.log('\n=== AUTH ===');
    let r = await fetch(`${BASE}/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'Test',email:'test@x.com',password:'test123'}) });
    let d = await r.json();
    assert('signup returns token', !!d.token, d);
    token = d.token;

    r = await fetch(`${BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'test@x.com',password:'test123'}) });
    d = await r.json();
    assert('login returns token', !!d.token, d);

    const auth = {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'};

    // 2. Products
    console.log('\n=== PRODUCTS ===');
    r = await fetch(`${BASE}/products`, { headers: auth });
    d = await r.json();
    assert('GET /products returns array', Array.isArray(d), d);
    assert('seed data loaded (5 products)', d.length === 5, d.length);
    productId = d.find(p => p.name === 'Steel Rods')?.id;

    r = await fetch(`${BASE}/products`, { method:'POST', headers:auth, body:JSON.stringify({name:'Test Widget',sku:'TW-999',category:'Test',unit:'pcs',qty_on_hand:50,cost_price:10,min_stock:5,location:'Rack A'}) });
    d = await r.json();
    assert('POST /products creates product', d.id && d.sku === 'TW-999', d);

    r = await fetch(`${BASE}/products/valuation`, { headers: auth });
    d = await r.json();
    assert('GET /products/valuation has total_value', d.total_value > 0, d);

    // 3. Receipts
    console.log('\n=== RECEIPTS ===');
    r = await fetch(`${BASE}/receipts`, { headers: auth });
    d = await r.json();
    assert('GET /receipts returns seeded data', d.length >= 3, d.length);

    r = await fetch(`${BASE}/receipts`, { method:'POST', headers:auth, body:JSON.stringify({supplier:'Test Supplier',lines:[{product_id:productId,qty:10}],notes:'test'}) });
    d = await r.json();
    assert('POST /receipts creates receipt', d.reference?.startsWith('REC/'), d);
    receiptId = d.id;
    assert('Receipt status is Draft', d.status === 'Draft', d.status);

    r = await fetch(`${BASE}/receipts/${receiptId}/validate`, { method:'POST', headers:auth });
    d = await r.json();
    assert('Validate receipt returns receipt+alerts', !!d.receipt && Array.isArray(d.low_stock_alerts), d);
    assert('Receipt status is Done after validate', d.receipt.status === 'Done', d.receipt.status);

    // Check stock increased
    r = await fetch(`${BASE}/products`, { headers: auth });
    d = await r.json();
    const sr = d.find(p => p.name === 'Steel Rods');
    assert('Steel Rods qty increased after receipt validate', sr.qty_on_hand === 130, sr.qty_on_hand);

    // 4. Deliveries
    console.log('\n=== DELIVERIES ===');
    r = await fetch(`${BASE}/deliveries`, { headers: auth });
    d = await r.json();
    assert('GET /deliveries returns seeded data', d.length >= 2, d.length);

    r = await fetch(`${BASE}/deliveries`, { method:'POST', headers:auth, body:JSON.stringify({customer:'Test Customer',lines:[{product_id:productId,qty:5}],notes:'test'}) });
    d = await r.json();
    assert('POST /deliveries creates delivery', d.reference?.startsWith('DEL/'), d);
    deliveryId = d.id;

    // 4b. Insufficient stock scenario
    r = await fetch(`${BASE}/deliveries`, { method:'POST', headers:auth, body:JSON.stringify({customer:'Fail Customer',lines:[{product_id:productId,qty:99999}],notes:''}) });
    const failDelivId = (await r.json()).id;
    r = await fetch(`${BASE}/deliveries/${failDelivId}/validate`, { method:'POST', headers:auth });
    d = await r.json();
    assert('Validate delivery with no stock returns 400', r.status === 400, r.status);
    assert('Insufficient stock error has details', Array.isArray(d.details), d);

    r = await fetch(`${BASE}/deliveries/${deliveryId}/validate`, { method:'POST', headers:auth });
    d = await r.json();
    assert('Validate delivery succeeds', !!d.delivery, d);
    assert('Delivery status Done', d.delivery.status === 'Done', d.delivery.status);

    // 5. Moves
    console.log('\n=== MOVES ===');
    r = await fetch(`${BASE}/moves`, { headers: auth });
    d = await r.json();
    assert('GET /moves returns logs', Array.isArray(d) && d.length > 0, d.length);

    // 6. Adjustments
    console.log('\n=== ADJUSTMENTS ===');
    r = await fetch(`${BASE}/adjustments`, { method:'POST', headers:auth, body:JSON.stringify({product_id:productId,qty_counted:100,location:'Rack A',reason:'Recount'}) });
    d = await r.json();
    assert('POST /adjustments works', !!d.adjustment, d);

    // 7. Dashboard
    console.log('\n=== DASHBOARD ===');
    r = await fetch(`${BASE}/dashboard`, { headers: auth });
    d = await r.json();
    assert('Dashboard has total_products', d.total_products > 0, d.total_products);
    assert('Dashboard has stock_chart_data', Array.isArray(d.stock_chart_data?.labels), d);
    assert('Dashboard chart has 7 labels', d.stock_chart_data.labels.length === 7, d.stock_chart_data.labels.length);

    // 8. Warehouses
    console.log('\n=== WAREHOUSES ===');
    r = await fetch(`${BASE}/warehouses`, { headers: auth });
    d = await r.json();
    assert('GET /warehouses returns data', Array.isArray(d) && d.length > 0, d);
    const wId = d[0].id;

    r = await fetch(`${BASE}/warehouses/${wId}/locations`, { method:'POST', headers:auth, body:JSON.stringify({location_name:'Cold Storage'}) });
    d = await r.json();
    assert('POST /warehouses/:id/locations adds location', d.locations.includes('Cold Storage'), d.locations);

  } catch(e) {
    console.log('FATAL:', e.message);
    failed++;
  }

  console.log(`\n============================`);
  console.log(`  PASSED: ${passed}  FAILED: ${failed}`);
  console.log(`============================\n`);
}
test();
