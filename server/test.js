// test.js
async function test() {
  try {
    // 1. Signup
    let res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Test User', email: 'test@admin.com', password: 'password1'})
    });
    let data = await res.json();
    console.log('Signup:', data.token ? 'Success (Token received)' : data);
    const token = data.token;

    // 2. Login
    res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'test@admin.com', password: 'password1'})
    });
    data = await res.json();
    console.log('Login:', data.token ? 'Success (Token received)' : data);

    // 3. GET /api/products
    res = await fetch('http://localhost:5000/api/products', {
      headers: {'Authorization': `Bearer ${token}`}
    });
    data = await res.json();
    console.log('GET /api/products:', Array.isArray(data) ? `Success (Array length: ${data.length})` : data);

  } catch (e) {
    console.error('Test error:', e);
  }
}
test();
