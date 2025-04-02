import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3030;

// API mock đơn giản
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Xin chào từ MiniApp LINE API!' });
});

// Phục vụ trang test-app.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-app.html'));
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`📡 Máy chủ kiểm tra đang chạy tại http://localhost:${port}`);
}); 