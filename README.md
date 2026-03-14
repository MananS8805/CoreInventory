# CoreInventory

CoreInventory is a full-stack inventory management prototype built for learning and collaboration. It demonstrates modern best practices using **React, Vite, and Tailwind CSS** on the frontend and **Express.js** on the backend, with **JWT-based authentication** and RESTful APIs.

---

# Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js 18+
- Express
- REST API
- JWT Authentication

---

# Project Structure

```
CoreInventory
│
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/                 # Express backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── data/
│   ├── package.json
│   └── index.js
│
├── .gitignore
└── README.md
```

---

# Prerequisites

Make sure the following tools are installed:

- Node.js **18+**
- npm
- Git (recommended)

---

# Installation

### 1. Clone the repository

```bash
git clone https://github.com/MananS8805/CoreInventory.git
cd CoreInventory
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

---

# Run Locally

You need **two terminals**.

### Terminal 1 — Start Backend Server

```bash
cd server
npm start
```

Backend runs at:

```
http://localhost:5000
```

---

### Terminal 2 — Start Frontend

```bash
cd client
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# Verify Service Availability

- Application: `http://localhost:5173`
- API check: `http://localhost:5000/api/products`

---

# Environment Variables (Optional)

You can configure the API URL using `.env`.

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Update `src/api/client.js`:

```javascript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
```

Add `.env` to `.gitignore`:

```
node_modules/
dist/
backend/node_modules/
.env
```

---

# User Workflows

1. **Signup:** `/signup`
2. **Login:** `/login`
   - Email + password
   - OTP login (simulated)
3. **Dashboard:** `/` → redirects to dashboard

---

# API Endpoints

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`

---

### Inventory

- `GET /api/products`
- `GET /api/receipts`
- `GET /api/deliveries`
- `GET /api/moves`

---

### Warehouses

- `GET /api/warehouses`
- `POST /api/warehouses`
- `PUT /api/warehouses/:id`
- `POST /api/warehouses/:id/locations`

---

# Team Roles (3-Person Collaboration)

## Manan Sheth — Backend & Data Layer

Responsible for backend architecture, APIs, and inventory logic.

### Responsibilities
- Setup Express backend server
- Implement API routes and authentication
- Build inventory data models
- Handle product stock and valuation logic

### Features Owned
- Express server + routes + authentication
- Product CRUD APIs
- Stock ledger management
- Receipt / delivery / adjustment APIs
- Move history logging endpoint
- Stock valuation endpoint (quantity × cost)
- Bulk import API (parse + create products)
- Low-stock validation after stock updates

### Deliverables
- ✔ All APIs implemented and accessible from frontend  
- ✔ Bulk import endpoint ready for UI integration

---

## Kalp Soneji — Core UI & Analytics

Responsible for the main UI screens and analytics dashboards.

### Responsibilities
- Build React UI pages
- Connect frontend with backend APIs
- Implement analytics and charts

### Features Owned
- Dashboard KPI cards
- Product list + create/edit forms
- Receipts and deliveries list + details
- Validate button triggering API calls
- Stock movement charts (Chart.js)
- Top 5 most moved products chart
- Excel / CSV export on list views
- Bulk import UI (upload + preview table)

### Deliverables
- ✔ All main application screens  
- ✔ Charts and export features  
- ✔ Bulk import user interface

---

## Vatsal Shah — Authentication, UX & Polish

Responsible for authentication flow and overall user experience improvements.

### Responsibilities
- Implement authentication system
- Improve usability and UI experience
- Add notification and productivity features

### Features Owned
- Login / Signup pages
- JWT authentication flow
- Protected route wrapper
- Move history list with filters
- Warehouse / location settings
- Dark mode toggle
- Global search bar in navigation
- Low-stock heatmap panel
- Real-time low-stock toast alerts
- Product audit trail / timeline
- Print-ready receipt slip (`window.print`)

---

# GitHub Development Workflow

### 1. Create a feature branch

```bash
git checkout -b feat/<feature-name>
```

### 2. Commit your work

```bash
git add .
git commit -m "feat: add feature"
```

### 3. Push branch

```bash
git push origin feat/<feature-name>
```

### 4. Open Pull Request on GitHub and request review.

---

# Troubleshooting

## Black Screen

Clear browser storage:

```javascript
localStorage.clear()
```

Then refresh:

```
http://localhost:5173
```

---

## Backend Not Responding

Check API directly:

```
http://localhost:5000/api/products
```

It should return JSON.

---

## CORS / Network Issues

Ensure:

- Backend running on **port 5000**
- Frontend running on **port 5173**
- Backend uses `cors()` middleware in `server/index.js`

---

# Commands Summary

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm start
```

---

# Future Improvements

- Replace in-memory store with **PostgreSQL / SQLite**
- Add **bcrypt password hashing**
- Implement **JWT refresh tokens**
- Add **unit and integration tests** (Jest / React Testing Library)
- Implement **inventory analytics dashboard**

---

# License

MIT License
