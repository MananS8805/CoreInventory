import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  canceled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
};

export default function ReceiptList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/receipts');
      setReceipts(res.data || []);
    } catch {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = receipts.filter(r =>
    !filter || r.status === filter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Receipts</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="done">Done</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Reference', 'Supplier', 'Warehouse', 'Status', 'Lines', 'Created', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No receipts found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                <td className="px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400">{r.reference}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.supplier}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.warehouse || 'Main Warehouse'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[r.status] || STATUS_COLORS.draft}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.lines?.length || 0} items</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <button onClick={() => navigate(`/receipts/${r.id}`)}
                    className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}