import client from './client';

export const getWarehouses = () => client.get('/warehouses');
export const createWarehouse = (data) => client.post('/warehouses', data);
export const updateWarehouse = (id, data) => client.put(`/warehouses/${id}`, data);
export const addLocation = (id, location_name) =>
  client.post(`/warehouses/${id}/locations`, { location_name });
