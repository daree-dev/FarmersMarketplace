const BASE = '/api';
let loadingCallback = null;
let logoutCallback = null;

export function setLoadingCallback(callback) {
  loadingCallback = callback;
}

export function setLogoutCallback(callback) {
  logoutCallback = callback;
}

function getToken() {
  return localStorage.getItem('token');
}

function getErrorMessage(error, data) {
  if (data?.error) return data.error;
  if (typeof data === 'string') return data;
  if (error?.message) return error.message;
  return 'Something went wrong';
}

async function request(path, options = {}, retries = 0) {
  loadingCallback?.(true);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      logoutCallback?.();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const message = getErrorMessage(null, data);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (retries < 1 && error instanceof TypeError) {
      await new Promise(r => setTimeout(r, 500));
      return request(path, options, retries + 1);
    }
    throw error;
  } finally {
    loadingCallback?.(false);
  }
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),

  getProducts: (filters = {}) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '' && v != null)).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => request('/products/categories'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', { method: 'POST', body }),
  getMyProducts: () => request('/products/mine/list'),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  placeOrder: (body) => request('/orders', { method: 'POST', body }),
  getOrders: () => request('/orders'),
  getSales: () => request('/orders/sales'),

  getWallet: () => request('/wallet'),
  getTransactions: () => request('/wallet/transactions'),
  fundWallet: () => request('/wallet/fund', { method: 'POST' }),
};
