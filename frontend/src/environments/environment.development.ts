// ===== src/environments/environment.development.ts =====
export const environment = {
  production: true,
  apiUrl: '/api',  // Nginx will proxy this to backend
  serverUrl: 'http://localhost:3000'  // Full server URL for file serving (matches backend PORT in .env)
};