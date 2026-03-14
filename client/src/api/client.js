import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

client.interceptors.request.use(async (config) => {
  try {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Could not get Clerk token', e);
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default client;