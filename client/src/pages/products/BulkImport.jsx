import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function BulkImport() {
  const navigate = useNavigate();
  const { refreshProducts } = useAppContext();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an Excel file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/products/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      refreshProducts();
      toast.success(`Imported ${res.data.created} products`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Products</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bulk Import</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
          <p className="font-semibold mb-1">Required Excel columns (row 1):</p>
          <code className="text-xs">name | sku | category | unit | qty_on_hand | cost_price | min_stock | location</code>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Excel file (.xlsx)
          </label>
          <input
            type="file" accept=".xlsx,.xls"
            onChange={e => { setFile(e.target.files[0]); setResult(null); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>

        <button onClick={handleUpload} disabled={loading || !file}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Importing...' : 'Import Products'}
        </button>

        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-4">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                ✅ Created: {result.created}
              </span>
              {result.failed > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  ❌ Failed: {result.failed}
                </span>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/10">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Errors:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-300">
                    Row {err.row} ({err.sku}): {err.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
