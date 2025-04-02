# Hướng dẫn triển khai ứng dụng MiniApp Line

## 1. Triển khai Server API

Bạn cần triển khai server API trước để client có thể gọi API.

### Cách 1: Triển khai trên Render.com (Đơn giản nhất)

1. Đăng ký tài khoản miễn phí tại [Render.com](https://render.com)
2. Tạo mới Web Service:
   - Kết nối với GitHub repository của bạn
   - Cấu hình như sau:
     - Name: `miniapp-line-api` (hoặc tên tùy ý)
     - Environment: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Chọn gói Free tier

3. Thêm các biến môi trường:
   - `DATABASE_URL`: URL kết nối database (SQLite hoặc PostgreSQL)
   - `SESSION_SECRET`: Khóa bảo mật cho session
   - `STRIPE_SECRET_KEY`: Khóa API Stripe test
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: https://trudyan141.github.io

4. Đợi dịch vụ được triển khai và lưu URL của server (ví dụ: `https://miniapp-line-api.onrender.com`)

### Cách 2: Triển khai trên Railway.app

1. Đăng ký tài khoản tại [Railway.app](https://railway.app)
2. Tạo project mới:
   - Kết nối với GitHub repository
   - Thiết lập tương tự như Render.com
   - Thêm các biến môi trường tương tự

### Cách 3: Triển khai trên Heroku

1. Cài đặt [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Đăng nhập và triển khai:
   ```bash
   heroku login
   heroku create miniapp-line-api
   git push heroku main
   heroku config:set DATABASE_URL=your-database-url
   heroku config:set SESSION_SECRET=your-secret
   heroku config:set STRIPE_SECRET_KEY=your-stripe-key
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://trudyan141.github.io
   ```

## 2. Cập nhật client để sử dụng API từ server đã triển khai

1. Cập nhật file `client/src/lib/api.ts` và thay đổi `API_BASE_URL` thành URL server của bạn:
   ```typescript
   export const API_BASE_URL = 'https://your-server-url.onrender.com';
   ```

2. Build lại client và đẩy lên GitHub Pages

## 3. Kiểm tra kết nối

1. Truy cập vào ứng dụng GitHub Pages của bạn
2. Mở Dev Tools (F12) và kiểm tra mạng (Network)
3. Thử thực hiện các tác vụ có gọi API để kiểm tra kết nối

## Xử lý CORS

Nếu bạn gặp lỗi CORS:
1. Đảm bảo rằng server đã được cấu hình để chấp nhận yêu cầu từ tên miền GitHub Pages của bạn
2. Kiểm tra lại cấu hình CORS trong `server/index.ts` 
3. Đảm bảo rằng credentials được đặt thành `true` trong cả server và client

## Xử lý Cookie cho Cross-domain

Khi server và client ở các tên miền khác nhau:
1. Sử dụng SameSite=None và Secure=true cho cookie (chỉ hoạt động trên HTTPS)
2. Đảm bảo server được triển khai trên HTTPS
3. Cấu hình credentials cho fetch API 