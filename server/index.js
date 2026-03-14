require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./data/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./middleware/auth'), require('./routes/products'));
app.use('/api/receipts', require('./middleware/auth'), require('./routes/receipts'));
app.use('/api/deliveries', require('./middleware/auth'), require('./routes/deliveries'));
app.use('/api/moves', require('./middleware/auth'), require('./routes/moves'));
app.use('/api/adjustments', require('./middleware/auth'), require('./routes/adjustments'));
app.use('/api/warehouses', require('./middleware/auth'), require('./routes/warehouses'));
app.use('/api/dashboard', require('./middleware/auth'), require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    const seed = require('./data/seed');
    await seed();
    app.listen(PORT, () => console.log(`CoreInventory API running on port ${PORT}`));
});