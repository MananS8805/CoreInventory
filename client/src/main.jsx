import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk publishable key');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/login">
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster position="top-right" />
      </AppProvider>
    </BrowserRouter>
  </ClerkProvider>
);
