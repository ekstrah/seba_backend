const User = require('./user.model');
const Consumer = require('./consumer.model');
const Farmer = require('./farmer.model');
const Product = require('./product.model');
const Category = require('./category.model');
const Cart = require('./cart.model');
const CartItem = require('./cartItem.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const Address = require('./address.model');
const PaymentMethod = require('./paymentMethod.model');
const Review = require('./review.model');

module.exports = {
    User,
    Consumer,
    Farmer,
    Product,
    Category,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Address,
    PaymentMethod,
    Review
}; 