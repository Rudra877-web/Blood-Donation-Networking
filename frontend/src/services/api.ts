import axios from 'axios';

export const TOKEN_KEY = 'bdns_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url: string = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const errMsg = (e: any): string =>
  e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : e?.message) || 'Something went wrong';

export const get = async <T = any>(url: string, params?: Record<string, any>): Promise<T> => {
  const clean = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)) : undefined;
  return (await api.get(url, { params: clean })).data.data;
};
export const post = async <T = any>(url: string, body?: any): Promise<T & { _message?: string }> => {
  const res = await api.post(url, body);
  return Object.assign({}, res.data.data ?? {}, { _message: res.data.message });
};
export const put = async <T = any>(url: string, body?: any): Promise<T> => (await api.put(url, body)).data.data;
export const del = async (url: string) => (await api.delete(url)).data;
export const msgOf = async (p: Promise<any>) => p;

export default api;
