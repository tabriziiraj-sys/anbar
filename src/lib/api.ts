// API Client for Server Communication
const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Users
  getUsers: () => fetchJson<any[]>('/users'),
  createUser: (user: any) => fetchJson('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: string, user: any) => fetchJson(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  
  // Company
  getCompany: () => fetchJson<any>('/company'),
  updateCompany: (company: any) => fetchJson('/company', { method: 'PUT', body: JSON.stringify(company) }),
  
  // Parties
  getParties: () => fetchJson<any[]>('/parties'),
  createParty: (party: any) => fetchJson('/parties', { method: 'POST', body: JSON.stringify(party) }),
  updateParty: (id: string, party: any) => fetchJson(`/parties/${id}`, { method: 'PUT', body: JSON.stringify(party) }),
  deleteParty: (id: string) => fetchJson(`/parties/${id}`, { method: 'DELETE' }),
  
  // Categories
  getCategories: () => fetchJson<any[]>('/categories'),
  createCategory: (category: any) => fetchJson('/categories', { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: (id: string, category: any) => fetchJson(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) }),
  deleteCategory: (id: string) => fetchJson(`/categories/${id}`, { method: 'DELETE' }),
  
  // Products
  getProducts: () => fetchJson<any[]>('/products'),
  createProduct: (product: any) => fetchJson('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, product: any) => fetchJson(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id: string) => fetchJson(`/products/${id}`, { method: 'DELETE' }),
  
  // Stock Docs
  getStockDocs: () => fetchJson<any[]>('/stock-docs'),
  createStockDoc: (doc: any) => fetchJson('/stock-docs', { method: 'POST', body: JSON.stringify(doc) }),
  updateStockDoc: (id: string, doc: any) => fetchJson(`/stock-docs/${id}`, { method: 'PUT', body: JSON.stringify(doc) }),
  deleteStockDoc: (id: string) => fetchJson(`/stock-docs/${id}`, { method: 'DELETE' }),
  
  // Payments
  getPayments: () => fetchJson<any[]>('/payments'),
  createPayment: (payment: any) => fetchJson('/payments', { method: 'POST', body: JSON.stringify(payment) }),
  updatePayment: (id: string, payment: any) => fetchJson(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(payment) }),
  deletePayment: (id: string) => fetchJson(`/payments/${id}`, { method: 'DELETE' }),
  
  // Purchases
  getPurchases: () => fetchJson<any[]>('/purchases'),
  createPurchase: (purchase: any) => fetchJson('/purchases', { method: 'POST', body: JSON.stringify(purchase) }),
  updatePurchase: (id: string, purchase: any) => fetchJson(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(purchase) }),
  deletePurchase: (id: string) => fetchJson(`/purchases/${id}`, { method: 'DELETE' }),
  
  // Expenses
  getExpenses: () => fetchJson<any[]>('/expenses'),
  createExpense: (expense: any) => fetchJson('/expenses', { method: 'POST', body: JSON.stringify(expense) }),
  updateExpense: (id: string, expense: any) => fetchJson(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(expense) }),
  deleteExpense: (id: string) => fetchJson(`/expenses/${id}`, { method: 'DELETE' }),
  
  // Expense Types
  getExpenseTypes: () => fetchJson<any[]>('/expense-types'),
  createExpenseType: (type: any) => fetchJson('/expense-types', { method: 'POST', body: JSON.stringify(type) }),
  
  // Audit Logs
  getAuditLogs: () => fetchJson<any[]>('/audit-logs'),
  createAuditLog: (log: any) => fetchJson('/audit-logs', { method: 'POST', body: JSON.stringify(log) }),
  
  // Settings
  getSettings: () => fetchJson<any>('/settings'),
  updateSettings: (settings: any) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  
  // Health
  health: () => fetchJson<any>('/health'),
};
