// Backend/config/permissions.js

export const permissions = {
  // Product
  createProduct: ['admin', 'farmer'],
  deleteProduct: ['admin', 'farmer'],
  updateProduct: ['admin', 'farmer'],
  getFarmerProducts: ['admin', 'farmer'],
  getMyProducts: ['admin', 'farmer'],
  getProductById: ['admin', 'farmer', 'consumer', 'guest'],
  getAllProducts: ['admin', 'farmer', 'consumer', 'guest'],
  getRelatedProducts: ['admin', 'farmer', 'consumer', 'guest'],

  // Cart
  addToCart: ['consumer'],
  clearCart: ['consumer'],
  getOrCreateCart: ['consumer'],
  removeFromCart: ['consumer'],
  updateCartItem: ['consumer'],

  // Auth
  checkAuth: ['admin', 'farmer', 'consumer'],
  login: ['guest'],
  logout: ['admin', 'farmer', 'consumer'],
  signup: ['guest'],
  verifyEmail: ['guest'],
  forgotPassword: ['guest'],
  resetPassword: ['guest'],

  // Order
  createOrderFromCart: ['consumer'],
  getAllOrders: ['admin'],
  getOrderById: ['admin', 'farmer', 'consumer'],
  getOrdersByConsumer: ['consumer'],
  getOrdersByFarmer: ['farmer'],
  updateOrderItemStatus: ['farmer'],
  updateOrderStatus: ['admin'],
  updatePaymentStatus: ['admin'],
  createGuestOrder: ['guest'],
  guestPaymentIntent: ['guest'],
  cancelOrder: ['consumer'],
  createPaymentIntent: ['consumer'],

  // Address
  addAddress: ['consumer', 'farmer'],
  deleteAddress: ['consumer'],
  getAddresses: ['consumer', 'farmer'],
  updateAddress: ['consumer', 'farmer'],
  getAddressById: ['admin', 'farmer'],

  // User
  getContactInfo: ['consumer'],
  updateContactInfo: ['consumer'],
  listPaymentMethods: ['consumer'],
  getFarmerDetails: ['admin', 'farmer', 'consumer', 'guest'],
  createSetupIntent: ['consumer'],
  updateFarmerProfile: ['farmer'],

  // Review
  createReview: ['consumer'],
  deleteReview: ['consumer'],
  updateReview: ['consumer'],
  getReviews: ['admin', 'farmer', 'consumer', 'guest'],

  // Category
  createCategory: ['admin'],
  deleteCategory: ['admin'],
  readAllCategories: ['admin', 'farmer', 'consumer', 'guest'],
}; 