import { useEffect, useState } from 'react';
import { getTransfers, createTransfer } from '../api/transfers';
import { getProducts } from '../api/products';
import toast from 'react-hot-toast';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    qty: '',
    from_location: '',
    to_location: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      const [transfersRes, productsRes] = await Promise.all([
        getTransfers(),
        getProducts()
      ]);
      setTransfers(transfersRes.data || []);
      setProducts(productsRes.data || []);
      // For now, we'll extract locations from products' stock_by_location
      // In the future, this could come from a dedicated warehouses API
    } catch (e) {
      console.error('Failed to load data', e);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTransfer(formData);
      toast.success('Transfer completed successfully');
      setFormData({
        product_id: '',
        qty: '',
        from_location: '',
        to_location: '',
        notes: ''
      });
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error('Failed to create transfer', e);
      toast.error(e.response?.data?.error || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const getAllLocations = () => {
    const locations = new Set();
    products.forEach(product => {
      if (product.stock_by_location) {
        Object.keys(product.stock_by_location).forEach(location => locations.add(location));
      } else if (product.location) {
        // Fallback for old structure
        locations.add(product.location);
      }
    });
    return Array.from(locations).sort();
  };

  const getTotalStock = (product) => {
    if (product.stock_by_location) {
      return Object.values(product.stock_by_location).reduce((sum, qty) => sum + qty, 0);
    }
    return product.qty_on_hand || 0;
  };

  const getStockInLocation = (product, location) => {
    if (product.stock_by_location && product.stock_by_location[location]) {
      return product.stock_by_location[location];
    }
    return 0;
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const availableStockInLocation = selectedProduct ? getStockInLocation(selectedProduct, formData.from_location) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Internal Transfers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'New Transfer'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold">Create New Transfer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Total Stock: {getTotalStock(product)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  min="1"
                  max={availableStockInLocation}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Location</label>
                <select
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                >
                  <option value="">Select From Location</option>
                  {getAllLocations().map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Location</label>
                <select
                  value={formData.to_location}
                  onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                >
                  <option value="">Select To Location</option>
                  {getAllLocations().map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                rows="3"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transfer History</h3>
        </div>
        <div className="p-6">
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No transfers yet. Create your first internal transfer above.
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map(transfer => (
                <div key={transfer.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{transfer.product_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {transfer.from_location} → {transfer.to_location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                        {transfer.qty} units
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {transfer.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{transfer.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}