# Authentication & Authorization

## Overview

Authentication and authorization are handled using JWT (JSON Web Tokens). Users must authenticate to access protected resources. Role-based access control is enforced for sensitive operations.

## Signup Flow
1. User submits signup form with email and password.
2. Server creates a new user and sends a verification email.
3. User verifies their email via a link.

## Login Flow
1. User submits email and password.
2. Server verifies credentials.
3. On success, server issues a JWT and sets it as an HTTP-only cookie.

## JWT Authentication
- JWT is used to authenticate users for protected routes.
- Token is sent in the `Authorization` header: `Bearer <token>`.
- Middleware (`verifyToken.js`) checks and decodes the token.

## Authorization
- Middleware (`authorize.js`) checks user roles and permissions.
- Roles include: `admin`, `farmer`, `consumer`.
- Certain routes are restricted to specific roles (e.g., only farmers can create products).

## Password Reset
1. User requests password reset.
2. Server sends a reset link via email.
3. User sets a new password using the link.

## Email Verification
- On signup, users receive a verification email.
- Account is activated after verification.

## Example Protected Route
```js
router.get('/profile', verifyToken, userController.getProfile);
``` 