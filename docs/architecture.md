# Architecture

## Overview

This backend is structured as a modular Node.js REST API using Express.js and MongoDB (via Mongoose). It follows a layered architecture for maintainability and scalability.

## Main Components
- **Routes**: Define API endpoints and map them to controllers.
- **Controllers**: Contain business logic for each resource (products, users, orders, etc.).
- **Models**: Define MongoDB schemas and data relationships using Mongoose.
- **Middleware**: Handle authentication, authorization, error handling, and request validation.
- **Utils**: Provide helper functions (email, logging, etc.).
- **Config**: Store configuration and permission logic.

## Request Flow
1. **Client** sends an HTTP request to an API endpoint.
2. **Route** receives the request and applies any route-specific middleware.
3. **Middleware** (e.g., authentication) processes the request.
4. **Controller** executes business logic and interacts with **Models**.
5. **Model** performs database operations via Mongoose.
6. **Controller** sends a response back to the client.

## Example Flow
```
Client → Route → Middleware → Controller → Model (DB) → Controller → Response
```

## Additional Features
- **Email notifications** for account actions and order updates
- **Stripe integration** for payments
- **Docker** for containerized development and testing 