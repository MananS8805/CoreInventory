import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function ProductHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [histRes, prodRes] = await Promise.all([
          client.get(`/products/${id}/history`),
          client.get(`/products/${id}`)
        ]);
        setLogs(histRes.data || []);
        setProductName(prodRes.data?.name || '');
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const typeColors = {
    receipt: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    delivery: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    adjustment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Products</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Stock History {productName && `— ${productName}`}
        </h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Date', 'Type', 'Qty Change', 'Before', 'After', 'Reference', 'Notes'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No history found</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="bg-white dark:bg-gray-900">
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{new Date(l.date).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${typeColors[l.type] || ''}`}>{l.type}</span>
                </td>
                <td className={`px-3 py-2 font-semibold ${l.qty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {l.qty >= 0 ? `+${l.qty}` : l.qty}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{l.qty_before}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{l.qty_after}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-xs">{l.reference}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{l.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
