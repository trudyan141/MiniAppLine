# Guide to Run and Deploy MiniApp LINE Application

## 1. Development Setup

### Prerequisites
- Node.js (LTS version recommended)
- PostgreSQL database or Neon serverless PostgreSQL account
- LINE Developer account with LIFF ID

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgres://username:password@host:port/dbname
SESSION_SECRET=your_session_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_LIFF_ID=your_line_liff_id
```

### Install Dependencies
```bash
npm install
```

### Initialize Database
Run the following command to push your schema to the database:
```bash
npm run db:push
```

### Run Development Server
The project uses a single command to run both server and client in development mode:
```bash
npm run dev
```

This will start the server using `tsx` at `http://localhost:5000`. The development server handles both API requests and serves the frontend Vite application.

## 2. Production Deployment

### Build for Production
To build the application for production:
```bash
npm run build
```

This command:
1. Builds the client side with Vite into `dist/public`
2. Compiles the server using esbuild into `dist/index.js`

### Run in Production
To start the application in production mode:
```bash
npm start
```

This will run the app using `NODE_ENV=production node dist/index.js`.

### Deployment Options

#### 1. Traditional Hosting
- Ensure Node.js is installed on your server
- Copy all files to your server
- Install dependencies with `npm install --production`
- Set up environment variables
- Run the application with `npm start`

#### 2. Docker Deployment
Create a Dockerfile in the project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
```

Build and run the Docker image:
```bash
docker build -t miniapp-line .
docker run -p 5000:5000 -e DATABASE_URL=your_db_url -e SESSION_SECRET=your_secret -e STRIPE_SECRET_KEY=your_key -e VITE_LIFF_ID=your_liff_id miniapp-line
```

#### 3. Cloud Hosting
The application can be deployed to various cloud platforms:

- **Heroku**: Use the Procfile with `web: npm start`
- **Vercel**: Configure to run the Node.js server
- **Netlify**: Configure to run the Node.js function

## 3. LINE Integration Setup

1. Create a LINE Login channel in the LINE Developer Console
2. Set up a LIFF app and get your LIFF ID
3. Configure the LIFF endpoint URL to your application URL
4. Add the LIFF ID to your environment variables as `VITE_LIFF_ID`

## 4. Stripe Integration Setup

1. Create a Stripe account
2. Get your Stripe secret key from the dashboard
3. Add the key to your environment variables as `STRIPE_SECRET_KEY` 