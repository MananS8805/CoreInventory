import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { products, refreshProducts, lowStockAlerts, moves, refreshMoves, dashboardData, refreshDashboard } = useAppContext();
  const { isSignedIn } = useAuth() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      refreshProducts();
      refreshMoves();
      refreshDashboard();
    }
  }, [isSignedIn, refreshProducts, refreshMoves, refreshDashboard]);

  const getTotalStock = (product) => {
    if (product.stock_by_location) {
      return Object.values(product.stock_by_location).reduce((sum, qty) => sum + qty, 0);
    }
    return product.qty_on_hand || 0; // fallback for old structure
  };

  const totalStock = products.reduce((sum, item) => sum + getTotalStock(item), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-2xl font-bold">Inventory Overview</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Real-time insights for inventory operations.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Products</div>
          <div className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-300">{products.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Stock on Hand</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{totalStock}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Low Stock Alerts</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">{lowStockAlerts.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Inventory Value</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">${dashboardData.total_inventory_value || 0}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending Receipts</div>
          <div className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-300">{dashboardData.pending_receipts || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending Deliveries</div>
          <div className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-300">{dashboardData.pending_deliveries || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Receipts Today</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">{dashboardData.receipts_today || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Deliveries Today</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">{dashboardData.deliveries_today || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Transfers Today</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">{dashboardData.transfers_today || 0}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <button onClick={() => navigate('/products')}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-left hover:scale-[1.01] hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30">
          <div className="font-semibold">Manage Products</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Create, update & track inventory</p>
        </button>
        <button onClick={() => navigate('/low-stock')}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-left hover:scale-[1.01] hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30">
          <div className="font-semibold">Low Stock Panel</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Monitor & restock alerts</p>
        </button>
        <button onClick={() => navigate('/moves')}
          className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-left hover:scale-[1.01] hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/30">
          <div className="font-semibold">View Move History</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Track all inventory movements</p>
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <button onClick={() => navigate('/receipts')}
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-left hover:scale-[1.01] hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30">
          <div className="font-semibold">Receipts (Incoming)</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Process incoming stock</p>
        </button>
        <button onClick={() => navigate('/deliveries')}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-left hover:scale-[1.01] hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30">
          <div className="font-semibold">Deliveries (Outgoing)</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Manage outgoing shipments</p>
        </button>
        <button onClick={() => navigate('/transfers')}
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-left hover:scale-[1.01] hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30">
          <div className="font-semibold">Internal Transfers</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Move stock between locations</p>
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Top Moved Products</h3>
        <div className="space-y-2">
          {moves.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No move data yet.</div>
          ) : (
            (() => {
              const counts = moves.reduce((acc, item) => {
                const name = item.product_name || 'Unknown';
                acc[name] = (acc[name] || 0) + Math.abs(item.qty || 0);
                return acc;
              }, {});
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
              const max = sorted.length ? sorted[0][1] : 1;
              return sorted.map(([name, qty]) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-800 dark:text-gray-200">
                    <span>{name}</span>
                    <span>{qty}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${Math.round((qty / max) * 100)}%` }} />
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </section>
    </div>
  );
}