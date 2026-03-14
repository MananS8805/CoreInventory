import client from './client';

export const getTransfers = () => client.get('/transfers');
export const createTransfer = (data) => client.post('/transfers', data);