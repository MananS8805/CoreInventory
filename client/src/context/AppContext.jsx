import { createContext, useContext, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import client from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [moves, setMoves] = useState([]);
  const recentLowStockIds = useRef(new Set());
  const { isSignedIn } = useAuth() || {};

  const refreshProducts = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await client.get('/products');
      const list = res.data || [];
      setProducts(list);
      const low = list.filter((p) => p.qty_on_hand <= p.min_stock);
      setLowStockAlerts(low);
      const newLow = low.filter((item) => !recentLowStockIds.current.has(item._id));
      if (newLow.length > 0) {
        toast.error(`Low stock: ${newLow.map((i) => i.name).join(', ')}`, { duration: 5500 });
      }
      recentLowStockIds.current = new Set(low.map((i) => i._id));
    } catch (e) {
      console.error('Failed to refresh products', e);
    }
  }, [isSignedIn]);

  const refreshMoves = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await client.get('/moves');
      setMoves(res.data || []);
    } catch (e) {
      console.error('Failed to refresh moves', e);
    }
  }, [isSignedIn]);

  return (
    <AppContext.Provider value={{
      products,
      refreshProducts,
      lowStockAlerts,
      setLowStockAlerts,
      moves,
      refreshMoves,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);