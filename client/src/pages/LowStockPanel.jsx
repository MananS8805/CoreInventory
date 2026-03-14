import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function LowStockPanel() {
  const { lowStockAlerts, refreshProducts } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const { lowStock, outOfStock } = useMemo(() => {
    const low = lowStockAlerts.filter((p) => p.qty_on_hand > 0 && p.qty_on_hand <= p.min_stock).length;
    const out = lowStockAlerts.filter((p) => p.qty_on_hand === 0).length;
    return { lowStock: low, outOfStock: out };
  }, [lowStockAlerts]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Low Stock Alerts</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <div className="text-sm text-amber-800 dark:text-amber-200">Low Stock</div>
          <div className="text-3xl font-bold text-amber-800 dark:text-amber-100">{lowStock}</div>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/40">
          <div className="text-sm text-red-800 dark:text-red-200">Out of Stock</div>
          <div className="text-3xl font-bold text-red-800 dark:text-red-100">{outOfStock}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 text-left dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Product</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">SKU</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Category</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Location</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Current Qty</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Min Stock</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {lowStockAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                  No low stock alerts.
                </td>
              </tr>
            ) : (
              lowStockAlerts.map((product) => {
                const isOut = product.qty_on_hand === 0;
                const rowClass = isOut
                  ? 'bg-red-50 dark:bg-red-950/40'
                  : 'bg-amber-50 dark:bg-amber-950/40';
                const status = isOut ? 'Out of Stock' : 'Low Stock';
                return (
                  <tr key={product.id} className={`${rowClass} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{product.name}</td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{product.sku}</td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{product.category || '-'}</td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{product.location || '-'}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">{product.qty_on_hand}</td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{product.min_stock}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{status}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => navigate('/receipts')}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Create Receipt
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
