import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Person B's pages
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProductHistory from './pages/products/ProductHistory';
import BulkImport from './pages/products/BulkImport';
import ReceiptList from './pages/receipts/ReceiptList';
import ReceiptDetail from './pages/receipts/ReceiptDetail';
import DeliveryList from './pages/deliveries/DeliveryList';
import DeliveryDetail from './pages/deliveries/DeliveryDetail';
import ValuationReport from './pages/ValuationReport';

// Person C's pages
import MoveHistory from './pages/MoveHistory';
import LowStockPanel from './pages/LowStockPanel';
import Warehouses from './pages/Warehouses';

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        <Layout>{children}</Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
      <Route path="/products/:id/edit" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
      <Route path="/products/:id/history" element={<ProtectedRoute><ProductHistory /></ProtectedRoute>} />
      <Route path="/products/bulk-import" element={<ProtectedRoute><BulkImport /></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><ReceiptList /></ProtectedRoute>} />
      <Route path="/receipts/:id" element={<ProtectedRoute><ReceiptDetail /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><DeliveryList /></ProtectedRoute>} />
      <Route path="/deliveries/:id" element={<ProtectedRoute><DeliveryDetail /></ProtectedRoute>} />
      <Route path="/transfers" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
      <Route path="/adjustments" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
      <Route path="/moves" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
      <Route path="/low-stock" element={<ProtectedRoute><LowStockPanel /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
      <Route path="/valuation" element={<ProtectedRoute><ValuationReport /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}