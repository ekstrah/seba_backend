# Controllers

Controllers handle the business logic for each resource. Each controller corresponds to a set of routes and interacts with models.

## address.controller.js
- Manages user addresses (CRUD operations).

## auth.controller.js
- Handles user authentication (login, signup, password reset, email verification).

## cart.controller.js
- Manages shopping cart operations (add, remove, update items).

## category.controller.js
- Handles CRUD operations for product categories.

## email.controller.js
- Sends transactional emails (verification, password reset, order confirmation).

## order.controller.js
- Manages order creation, retrieval, and status updates.

## product.controller.js
- Handles CRUD operations for products.

## review.controller.js
- Manages product reviews (add, update, delete, fetch).

## stripeWebhook.controller.js
- Handles Stripe webhook events for payment processing.

## user.controller.js
- Manages user profiles, account updates, and user-specific actions. 