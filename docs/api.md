# API Overview

This API provides endpoints for managing users, products, categories, orders, carts, reviews, and authentication.

## Base URL
```
http://localhost:3000/api
```

## Main Endpoints
- `/auth` — Authentication (login, signup, password reset, verification)
- `/users` — User management
- `/products` — Product CRUD operations
- `/categories` — Category CRUD operations
- `/orders` — Order management
- `/cart` — Shopping cart operations
- `/reviews` — Product reviews
- `/address` — User addresses

## General Usage
- All endpoints accept and return JSON.
- Protected routes require a valid JWT token in the `Authorization` header: `Bearer <token>`.
- Some endpoints require specific roles (e.g., admin, farmer).

## Error Handling
- Errors are returned as JSON with an `error` message and appropriate HTTP status code. 