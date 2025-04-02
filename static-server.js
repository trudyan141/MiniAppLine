import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Kiểm tra xem đã build chưa
const distPath = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distPath)) {
  console.error('Thư mục dist/public không tồn tại!');
  console.error('Vui lòng chạy lệnh "npm run build" trước khi khởi động máy chủ.');
  process.exit(1);
}

// Phục vụ các tệp tĩnh từ thư mục dist/public
app.use(express.static(distPath));

// Tất cả các route khác đều trả về index.html (cho SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`Máy chủ tĩnh đang chạy tại http://localhost:${port}`);
  console.log(`Đang phục vụ nội dung từ: ${distPath}`);
}); 