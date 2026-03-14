import client from './client';

export const getProducts = () => client.get('/products');
export const getProduct = (id) => client.get(`/products/${id}`);
export const createProduct = (data) => client.post('/products', data);
export const updateProduct = (id, data) => client.put(`/products/${id}`, data);
export const deleteProduct = (id) => client.delete(`/products/${id}`);
export const getProductHistory = (id) => client.get(`/products/${id}/history`);
export const getValuation = () => client.get('/products/valuation');
export const bulkImportProducts = (data) => client.post('/products/bulk', data);