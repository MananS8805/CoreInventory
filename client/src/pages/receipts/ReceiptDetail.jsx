import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  canceled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
};

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProducts } = useAppContext();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/receipts/${id}`);
      setReceipt(res.data);
    } catch {
      toast.error('Receipt not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleValidate = async () => {
    if (!window.confirm('Validate this receipt? Stock will increase.')) return;
    setValidating(true);
    try {
      const res = await client.post(`/receipts/${id}/validate`);
      setReceipt(res.data.receipt);
      refreshProducts();
      if (res.data.low_stock_alerts?.length > 0) {
        res.data.low_stock_alerts.forEach(p =>
          toast.error(`Low stock: ${p.name} (${p.qty_on_hand} remaining)`, { duration: 5000 })
        );
      }
      toast.success('Receipt validated — stock updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this receipt?')) return;
    setCanceling(true);
    try {
      const res = await client.post(`/receipts/${id}/cancel`);
      setReceipt(res.data);
      toast.success('Receipt canceled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!receipt) return <div className="text-sm text-red-500">Receipt not found.</div>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/receipts')}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Back to Receipts</button>
        <button onClick={() => window.print()}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200">
          Print
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{receipt.reference}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Supplier: <span className="font-medium text-gray-700 dark:text-gray-300">{receipt.supplier}</span></p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created: {new Date(receipt.createdAt).toLocaleString()}</p>
            {receipt.validatedAt && <p className="text-sm text-gray-500 dark:text-gray-400">Validated: {new Date(receipt.validatedAt).toLocaleString()}</p>}
            {receipt.notes && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Notes: {receipt.notes}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${STATUS_COLORS[receipt.status] || STATUS_COLORS.draft}`}>
            {receipt.status}
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ordered Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Received Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {(receipt.lines || []).map((line, i) => (
                <tr key={i} className="bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{line.product_name}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.qty}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.received_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {receipt.status === 'draft' && (
          <div className="mt-6 flex gap-3">
            <button onClick={handleValidate} disabled={validating}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
              {validating ? 'Validating...' : 'Validate Receipt'}
            </button>
            <button onClick={handleCancel} disabled={canceling}
              className="rounded-lg border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-600 dark:text-red-400">
              {canceling ? 'Canceling...' : 'Cancel Receipt'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}