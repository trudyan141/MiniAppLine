import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import chalk from 'chalk';
import http from 'http';

const API_SERVER_PORT = 5000;
const CLIENT_SERVER_PORT = 3000;
const PROXY_SERVER_PORT = 9090;

const app = express();

// Middleware to log requests
app.use((req, res, next) => {
  console.log(chalk.blue(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`));
  next();
});

// Tự xử lý proxy cho API requests thay vì dùng http-proxy-middleware
app.use('/api', (req, res) => {
  const apiPath = req.originalUrl; // Giữ nguyên đường dẫn đầy đủ, bao gồm /api
  console.log(chalk.yellow(`Manual forwarding: ${req.method} ${apiPath} -> http://localhost:5000${apiPath}`));
  
  // Tạo một HTTP request đến API server
  const apiReq = http.request({
    host: 'localhost',
    port: 5000,
    path: apiPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:5000'
    }
  }, (apiRes) => {
    // Sao chép headers từ API response
    Object.keys(apiRes.headers).forEach(key => {
      res.setHeader(key, apiRes.headers[key]);
    });
    
    // Gửi status code
    res.statusCode = apiRes.statusCode;
    
    // Pipe dữ liệu từ API response sang client response
    apiRes.pipe(res);
    
    console.log(chalk.green(`Response from API: ${apiRes.statusCode}`));
  });
  
  // Xử lý lỗi
  apiReq.on('error', (err) => {
    console.error(chalk.red(`API Proxy Error: ${err.message}`));
    res.status(500).json({ error: 'API Proxy Error', message: err.message });
  });
  
  // Pipe dữ liệu từ client request sang API request
  req.pipe(apiReq);
});

// Client Proxy - Chuyển tiếp tất cả các request khác tới Client server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000', // Client server port
  changeOrigin: true
}));

// Start the proxy server
app.listen(PROXY_SERVER_PORT, () => {
  console.log(chalk.green.bold('================================================================='));
  console.log(chalk.green(`Proxy server running on http://localhost:${PROXY_SERVER_PORT}`));
  console.log(chalk.yellow(`API server: http://localhost:${API_SERVER_PORT}`));
  console.log(chalk.yellow(`Client server: http://localhost:${CLIENT_SERVER_PORT}`));
  console.log(chalk.green.bold('================================================================='));
}); 