FROM node:18-alpine

WORKDIR /app

# Sao chép package.json và package-lock.json trước để tận dụng cache
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Sao chép tất cả các file dự án 
COPY . .

# Build ứng dụng (server + client)
RUN npm run build

# Mở cổng 5000 để truy cập từ bên ngoài
EXPOSE 5000

# Khởi chạy ứng dụng
CMD ["npm", "start"] 