import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import chalk from 'chalk';

const API_SERVER_PORT = 5000;
const CLIENT_SERVER_PORT = 3000;
const PROXY_SERVER_PORT = 9090;

const app = express();

// Middleware to log requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(chalk.blue(`[${timestamp}] ${req.method} ${req.url}`));
  next();
});

// API Proxy - Use '/api' as the context for API requests
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${API_SERVER_PORT}`,
  changeOrigin: true,
  secure: false,
  logLevel: 'error',
  onError: (err, req, res) => {
    console.error(chalk.red('API Proxy Error:', err));
    res.status(500).json({ error: 'API Proxy Error' });
  }
}));

// Client Proxy - For all other requests, proxy to the client server
app.use('/', createProxyMiddleware({
  target: `http://localhost:${CLIENT_SERVER_PORT}`,
  changeOrigin: true,
  secure: false,
  logLevel: 'error',
  onError: (err, req, res) => {
    console.error(chalk.red('Client Proxy Error:', err));
    res.status(500).json({ error: 'Client Proxy Error' });
  }
}));

// Start the proxy server
app.listen(PROXY_SERVER_PORT, () => {
  console.log(chalk.green.bold('================================================================='));
  console.log(chalk.green(`Proxy server running on http://localhost:${PROXY_SERVER_PORT}`));
  console.log(chalk.yellow(`API server: http://localhost:${API_SERVER_PORT}`));
  console.log(chalk.yellow(`Client server: http://localhost:${CLIENT_SERVER_PORT}`));
  console.log(chalk.green.bold('================================================================='));
}); 