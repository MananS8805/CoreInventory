import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function ProductList() {
  const { products, refreshProducts } = useAppContext();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { refreshProducts(); }, [refreshProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await client.delete(`/products/${id}`);
      toast.success('Product deleted');
      refreshProducts();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const getTotalStock = (product) => {
    if (product.stock_by_location) {
      return Object.values(product.stock_by_location).reduce((sum, qty) => sum + qty, 0);
    }
    return product.qty_on_hand || 0; // fallback for old structure
  };

  const getStatusBadge = (p) => {
    const totalStock = getTotalStock(p);
    if (totalStock === 0)
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">Out of Stock</span>;
    if (totalStock <= p.min_stock)
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Low Stock</span>;
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">In Stock</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/products/bulk-import')}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300">
            Bulk Import
          </button>
          <button onClick={() => navigate('/products/new')}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            + New Product
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by name or SKU..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Name', 'SKU', 'Category', 'Unit', 'Total Qty', 'Min Stock', 'Stock by Location', 'Status', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No products found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.sku}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.category}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.unit}</td>
                <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">{getTotalStock(p)}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.min_stock}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  {p.stock_by_location ? Object.entries(p.stock_by_location).map(([loc, qty]) => (
                    <div key={loc} className="text-xs">{loc}: {qty}</div>
                  )) : p.location}
                </td>
                <td className="px-3 py-2">{getStatusBadge(p)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/products/${p.id}/history`)}
                      className="text-xs text-teal-600 hover:underline dark:text-teal-400">History</button>
                    <button onClick={() => navigate(`/products/${p.id}/edit`)}
                      className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">Edit</button>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                      className="text-xs text-red-500 hover:underline disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}