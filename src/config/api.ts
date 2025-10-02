// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-azure-app.azurewebsites.net';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

export const endpoints = {
  users: '/api/users',
  posts: '/api/posts',
  trips: '/api/trips',
  places: '/api/places',
  bookings: '/api/bookings',
  payments: '/api/payments',
  subscriptions: '/api/subscriptions',
};