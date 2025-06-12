# Backend API

A Node.js/Express backend API for an e-commerce platform with farmer and consumer features.

## Tech Stack
- Node.js with Express
- MongoDB (Mongoose)
- JWT Authentication
- Docker support

## Quick Start
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm start

# Run tests
npm run test:newman
```

## API Endpoints
- `/api/auth` - Authentication
- `/api/product` - Product management
- `/api/category` - Category management
- `/api/cart` - Shopping cart
- `/api/order-item` - Order management
- `/api/farmer` - Farmer management
- `/api/consumer` - Consumer management

## Environment Setup
Copy `example.env` to `.env` and configure your environment variables.

## Project Structure
```
├── controllers/    # Business logic
├── models/        # Database schemas
├── routes/        # API endpoints
├── middleware/    # Custom middleware
├── utils/         # Helper functions
├── tests/         # Test files
└── docker/        # Docker configuration
```