import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProducts } = useAppContext();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', sku: '', category: '', unit: 'pcs',
    qty_on_hand: 0, cost_price: 0, min_stock: 0, location: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    client.get(`/products/${id}`)
      .then(res => setForm(res.data))
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await client.put(`/products/${id}`, form);
        toast.success('Product updated');
      } else {
        await client.post('/products', form);
        toast.success('Product created');
      }
      refreshProducts();
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;

  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'sku', label: 'SKU', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'unit', label: 'Unit (pcs / kg / rolls...)', type: 'text' },
    { name: 'qty_on_hand', label: 'Qty on Hand', type: 'number' },
    { name: 'cost_price', label: 'Cost Price (₹)', type: 'number' },
    { name: 'min_stock', label: 'Min Stock', type: 'number' },
    { name: 'location', label: 'Location', type: 'text' },
  ];

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Products</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 dark:border-gray-800 dark:bg-gray-900">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              name={f.name} type={f.type} value={form[f.name] ?? ''} onChange={handleChange}
              required={f.required}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
