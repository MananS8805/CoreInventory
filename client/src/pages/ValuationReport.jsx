import { useEffect, useState } from 'react';
import client from '../api/client';
import toast from 'react-hot-toast';

export default function ValuationReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client.get('/products/valuation')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load valuation'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Valuation</h1>
        {data && (
          <div className="rounded-xl bg-indigo-600 px-5 py-3 text-white shadow">
            <p className="text-xs font-medium opacity-80">Total Value</p>
            <p className="text-2xl font-bold">₹{data.total_value.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Product', 'SKU', 'Category', 'Qty', 'Cost Price', 'Valuation'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {!data || data.products.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No products</td></tr>
            ) : data.products.map(p => (
              <tr key={p.id} className="bg-white dark:bg-gray-900">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.sku}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.category}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {p.stock_by_location
                    ? Object.values(p.stock_by_location).reduce((sum, qty) => sum + qty, 0)
                    : p.qty_on_hand || 0} {p.unit}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">₹{p.cost_price.toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400">₹{p.valuation.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
