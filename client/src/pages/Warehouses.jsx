import { useEffect, useState } from 'react';
import { getWarehouses, createWarehouse, updateWarehouse, addLocation } from '../api/warehouses';
import toast from 'react-hot-toast';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', short_code: '', address: '' });
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const res = await getWarehouses();
      setWarehouses(res.data || []);
    } catch (e) {
      console.error('Failed to load warehouses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const createNewWarehouse = async () => {
    if (!newWarehouse.name || !newWarehouse.short_code || !newWarehouse.address) {
      toast.error('All fields are required');
      return;
    }
    try {
      const res = await createWarehouse(newWarehouse);
      toast.success('Warehouse created');
      setWarehouses((prev) => [...prev, res.data]);
      setNewWarehouse({ name: '', short_code: '', address: '' });
    } catch (e) {
      toast.error('Failed to create warehouse');
      console.error(e);
    }
  };

  const saveWarehouse = async (id) => {
    const wh = warehouses.find((w) => w.id === id);
    if (!wh) return;
    try {
      await updateWarehouse(id, { name: wh.name, address: wh.address });
      toast.success('Warehouse updated');
      setEditing((prev) => ({ ...prev, [id]: false }));
    } catch (e) {
      toast.error('Failed to update warehouse');
    }
  };

  const addLocationToWarehouse = async (id, location) => {
    if (!location) {
      toast.error('Location name is required');
      return;
    }
    try {
      const res = await addLocation(id, location);
      setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, locations: [...(w.locations || []), res.data] } : w)));
      toast.success('Location added');
    } catch (e) {
      toast.error('Failed to add location');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Warehouses</h2>

      <div className="rounded border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-gray-100">New Warehouse</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, name: e.target.value }))}
            placeholder="Name"
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            value={newWarehouse.short_code}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, short_code: e.target.value }))}
            placeholder="Short Code"
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            value={newWarehouse.address}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, address: e.target.value }))}
            placeholder="Address"
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <button
          onClick={createNewWarehouse}
          className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Create Warehouse
        </button>
      </div>

      {loading ? (
        <div className="rounded border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="rounded border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                {editing[warehouse.id] ? (
                  <input
                    value={warehouse.name}
                    onChange={(e) => setWarehouses((prev) => prev.map((w) => (w.id === warehouse.id ? { ...w, name: e.target.value } : w)))}
                    className="w-1/2 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{warehouse.name}</h3>
                )}

                <button
                  onClick={() => (editing[warehouse.id] ? saveWarehouse(warehouse.id) : setEditing((p) => ({ ...p, [warehouse.id]: true })))}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  {editing[warehouse.id] ? 'Save' : 'Edit'}
                </button>
              </div>
              <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                {editing[warehouse.id] ? (
                  <input
                    value={warehouse.address}
                    onChange={(e) => setWarehouses((prev) => prev.map((w) => (w.id === warehouse.id ? { ...w, address: e.target.value } : w)))}
                    className="w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                ) : (
                  warehouse.address
                )}
              </div>
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">Short Code: {warehouse.short_code || '-'}</div>
              <div className="mb-3 flex flex-wrap gap-2">
                {(warehouse.locations || []).map((loc) => (
                  <span key={loc.id || loc} className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-200">
                    {loc.location_name || loc}
                  </span>
                ))}
              </div>
              <WarehouseLocationForm warehouse={warehouse} addLocation={addLocationToWarehouse} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WarehouseLocationForm({ warehouse, addLocation }) {
  const [locationInput, setLocationInput] = useState('');

  return (
    <div className="flex items-center gap-2">
      <input
        value={locationInput}
        onChange={(e) => setLocationInput(e.target.value)}
        placeholder="Add Location"
        className="flex-1 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />
      <button
        onClick={() => {
          addLocation(warehouse.id, locationInput);
          setLocationInput('');
        }}
        className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
      >
        Add
      </button>
    </div>
  );
}
