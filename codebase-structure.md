# MiniApp LINE Application Structure

## Overview
This application is a time cafe management system integrated with LINE LIFF (LINE Frontend Framework) and Stripe for payments. It allows users to check in to the cafe, place orders, and pay for their time and items.

## Technology Stack
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js (Node.js) with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth, LINE Login integration
- **Payment**: Stripe integration
- **Messaging**: LINE LIFF API for messaging and user data

## Directory Structure

```
/
├── client/                 # Client-side code
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and setup
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component and routing
│   │   ├── main.tsx        # Entry point with LINE initialization
│   │   └── index.css       # Global CSS
│   └── index.html          # HTML template
│
├── server/                 # Server-side code
│   ├── index.ts            # Main server entry point
│   ├── routes.ts           # API routes definition
│   ├── storage.ts          # Database access functions
│   ├── db.ts               # Database connection setup
│   ├── vite.ts             # Development server configuration
│   └── types.d.ts          # Type definitions
│
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema with Drizzle ORM
│
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.ts      # Tailwind CSS configuration
```

## Core Features

### 1. User Authentication
- LINE Login integration for seamless access
- Traditional username/password authentication
- Session management with express-session and PostgreSQL store

### 2. Check-in System
- QR code scanning for table check-in
- Time tracking for cafe visit duration
- Real-time session status updates

### 3. Menu and Ordering
- Food and beverage ordering system
- Categories for menu items
- Order tracking and history

### 4. Payment Processing
- Stripe integration for secure payments
- Time-based billing (cafe hourly rate)
- Food and beverage item billing
- Payment history and receipt generation

### 5. User Profile Management
- User profile connected to LINE account
- Order history and session history
- Payment method management

## Database Schema

The application uses the following database tables:

1. **users** - User information and LINE account details
2. **sessions** - Cafe visit sessions with check-in/out times
3. **menuItems** - Food and drink menu
4. **orders** - User orders associated with sessions
5. **orderItems** - Individual items in orders
6. **payments** - Payment transactions
7. **coupons** - Discount vouchers and promotions

## LINE Integration

The application integrates with LINE using the LIFF SDK for:
- User authentication via LINE accounts
- User profile information retrieval
- Message sharing functionality
- Deep linking capabilities

## Stripe Integration

Payment processing is handled via Stripe:
- Customer creation and management
- Payment method storage
- Secure checkout process
- Transaction history

## Project Architecture

### Frontend Architecture
- Uses React with functional components and hooks
- Routing with Wouter (lightweight router)
- State management with React Context and React Query
- UI components from Shadcn/ui (Radix UI based components)
- Styling with Tailwind CSS

### Backend Architecture
- Express.js REST API
- Database access layer with Drizzle ORM
- Connection to Neon PostgreSQL (serverless)
- Middleware for authentication and logging
- Session management with PostgreSQL store

### Development and Build Process
- Vite for fast development and optimized builds
- TypeScript for type safety across the stack
- Shared schemas between frontend and backend
- Single command to start both server and client in development 