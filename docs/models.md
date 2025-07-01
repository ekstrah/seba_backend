# Models

This backend uses Mongoose to define MongoDB schemas for all resources. Below are the main models and their relationships.

## User
- Fields: name, email, password, role, addresses, etc.
- Relationships: Can have multiple addresses, orders, reviews, and a cart.

## Farmer
- Fields: name, email, password, farm details, products, etc.
- Relationships: Can own multiple products.

## Consumer
- Fields: name, email, password, etc.
- Relationships: Can place orders, write reviews, and have a cart.

## Product
- Fields: name, description, price, category, stock, farmer, etc.
- Relationships: Belongs to a farmer and a category. Can have multiple reviews.

## Category
- Fields: name, description
- Relationships: Can have multiple products.

## Order
- Fields: user, items, total, status, payment info, etc.
- Relationships: Belongs to a user. Contains multiple order items.

## OrderItem
- Fields: product, quantity, price
- Relationships: Part of an order.

## Cart
- Fields: user, items
- Relationships: Belongs to a user. Contains multiple cart items.

## CartItem
- Fields: product, quantity
- Relationships: Part of a cart.

## Review
- Fields: user, product, rating, comment
- Relationships: Belongs to a user and a product.

## Address
- Fields: user, street, city, zip, country
- Relationships: Belongs to a user. 