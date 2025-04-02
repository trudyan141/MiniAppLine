import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3030; // Sử dụng cổng khác để tránh xung đột

// Thư mục để phục vụ ứng dụng client đã được build
const clientDistPath = path.join(__dirname, 'client-dist');

// Kiểm tra xem đã build chưa
if (!fs.existsSync(clientDistPath)) {
  console.error(`❌ Thư mục ${clientDistPath} không tồn tại!`);
  console.error('Vui lòng chạy lệnh "node client-build.mjs" trước tiên để build ứng dụng client.');
  process.exit(1);
}

// API mock đơn giản
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Xin chào từ MiniApp LINE API!' });
});

// Phục vụ các tệp tĩnh từ thư mục client-dist
app.use(express.static(clientDistPath));

// Tất cả các route khác đều trả về index.html (cho SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`📡 Máy chủ đang chạy tại http://localhost:${port}`);
  console.log(`📂 Đang phục vụ nội dung từ: ${clientDistPath}`);
}); 