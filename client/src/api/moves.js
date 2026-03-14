import client from './client';

export const getMoves = (params) => client.get('/moves', { params });
