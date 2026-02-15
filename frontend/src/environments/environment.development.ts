// ===== src/environments/environment.development.ts ===== for vercel
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  serverUrl: 'http://localhost:5000'
};

// ===== src/environments/environment.development.ts =====
//export const environment = {
  //production: true,
  //apiUrl: '/api',  // Nginx will proxy this to backend
  //serverUrl: 'http://localhost:3000'  // Full server URL for file serving (matches backend PORT in .env)
//};
