import { useEffect, useMemo, useState } from 'react';
import { getMoves } from '../api/moves';
import { exportToExcel } from '../utils/exportToExcel';

const typeColors = {
  receipt: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  delivery: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  adjustment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  transfer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
};

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMoves = async () => {
    setLoading(true);
    try {
      const res = await getMoves({ type: typeFilter || undefined, from_date: fromDate || undefined, to_date: toDate || undefined });
      setMoves(res.data || []);
    } catch (e) {
      console.error('Failed to load moves', e);
      setMoves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoves();
  }, [typeFilter, fromDate, toDate]);

  const filteredMoves = useMemo(() => {
    let list = moves;
    if (productSearch.trim()) {
      const q = productSearch.trim().toLowerCase();
      list = list.filter((m) => m.product_name?.toLowerCase().includes(q));
    }
    return list;
  }, [moves, productSearch]);

  const exportData = () => {
    const rows = filteredMoves.map((m) => ({
      Date: m.date || '',
      Type: m.type || '',
      Reference: m.reference || '',
      Product: m.product_name || '',
      SKU: m.sku || '',
      Qty: m.qty || 0,
      Location: `${m.from_location || ''} → ${m.to_location || ''}`,
      Status: m.status || '',
    }));
    exportToExcel(rows, 'move-history.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Move History</h2>
        <button
          onClick={exportData}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 rounded border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">All Types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer">Transfer</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Product name..."
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded border border-gray-200 bg-white p-6 text-center text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">Loading...</div>
      ) : filteredMoves.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">No move history matches the filters.</div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 text-left dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Type</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Reference</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Product</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">SKU</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Qty</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Location</th>
                <th className="px-3 py-2 text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredMoves.map((m) => (
                <tr key={`${m.id}-${m.date}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.date || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${typeColors[m.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                      {m.type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.reference || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.product_name || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.sku || '-'}</td>
                  <td className={`px-3 py-2 font-semibold ${m.qty >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                    {m.qty || 0}
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{`${m.from_location || '-'} → ${m.to_location || '-'}`}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{m.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
