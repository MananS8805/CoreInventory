import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import client from '../../api/client';

const routeTitles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/products/new': 'New Product',
  '/products/bulk-import': 'Bulk Import',
  '/receipts': 'Receipts',
  '/deliveries': 'Deliveries',
  '/moves': 'Move History',
  '/low-stock': 'Low Stock Alerts',
  '/warehouses': 'Warehouses',
  '/valuation': 'Valuation Report',
};

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const { products } = useAppContext();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const runSearch = async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    const normalized = q.toLowerCase();
    const productResults = products
      .filter((p) =>
        p.name?.toLowerCase().includes(normalized) || p.sku?.toLowerCase().includes(normalized)
      )
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        type: 'Product',
        label: p.name || p.sku,
        detail: `SKU: ${p.sku || 'N/A'}`,
        path: `/products`,
      }));

    const [receipts, deliveries] = await Promise.all([
      client.get('/receipts').then((r) => r.data || []).catch(() => []),
      client.get('/deliveries').then((r) => r.data || []).catch(() => []),
    ]);

    const receiptResults = receipts
      .filter((r) =>
        r.reference?.toLowerCase().includes(normalized) || r.supplier?.toLowerCase().includes(normalized)
      )
      .slice(0, 5)
      .map((r) => ({
        id: `receipt-${r._id}`,
        type: 'Receipt',
        label: r.reference || 'Receipt',
        detail: r.supplier || '',
        path: `/receipts/${r._id}`,
      }));

    const deliveryResults = deliveries
      .filter((d) =>
        d.reference?.toLowerCase().includes(normalized) || d.customer?.toLowerCase().includes(normalized)
      )
      .slice(0, 5)
      .map((d) => ({
        id: `delivery-${d._id}`,
        type: 'Delivery',
        label: d.reference || 'Delivery',
        detail: d.customer || '',
        path: `/deliveries/${d._id}`,
      }));

    const combined = [...productResults, ...receiptResults, ...deliveryResults].slice(0, 5);
    setResults(combined);
    setOpen(combined.length > 0);
  };

  useEffect(() => {
    const handle = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectResult = (r) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(r.path);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder="Search products, receipts, deliveries..."
        className="w-80 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => selectResult(r)}
              className="flex w-full items-start justify-between border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-100">{r.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">{r.type} · {r.detail}</div>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-300">Go</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user;
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('ci_theme') || 'light';
    setTheme(saved);
    const html = document.documentElement;
    html.classList.remove('dark', 'soft-theme');
    if (saved === 'dark') html.classList.add('dark');
    if (saved === 'soft') html.classList.add('soft-theme');
  }, []);

  const applyTheme = (nextTheme) => {
    const html = document.documentElement;
    html.classList.remove('dark', 'soft-theme');
    if (nextTheme === 'dark') html.classList.add('dark');
    if (nextTheme === 'soft') html.classList.add('soft-theme');
    localStorage.setItem('ci_theme', nextTheme);
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') applyTheme('dark');
    else if (theme === 'dark') applyTheme('soft');
    else applyTheme('light');
  };

  const title = routeTitles[location.pathname] || 'CoreInventory';
  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'CI';

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      <GlobalSearch />
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {theme === 'light' && 'Dark'}
          {theme === 'dark' && 'Soft'}
          {theme === 'soft' && 'Light'}
        </button>
        <div
          title={user?.name || 'User'}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}