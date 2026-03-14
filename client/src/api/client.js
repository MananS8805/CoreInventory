import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

client.interceptors.request.use(async (config) => {
  try {
    // Get Clerk session token
    const { getToken } = await import('@clerk/clerk-react');
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    // Clerk not available or not signed in
    console.warn('Clerk token not available:', err);
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Let Clerk handle logout
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;