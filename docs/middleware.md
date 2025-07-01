# Middleware

Middleware functions process requests before they reach controllers. They are used for authentication, authorization, validation, and more.

## authorize.js
- Checks if the user has the required permissions/roles to access a route.

## product.middleware.js
- Validates product-related requests (e.g., checks product existence, validates input).

## verifyToken.js
- Verifies JWT tokens for protected routes.

## Other Middleware
- Error handling and request validation (may be implemented inline or in other files). 