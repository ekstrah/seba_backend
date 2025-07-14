import stripe from '../utils/stripe.js';
import logger from "../utils/logger.js";
import { Order } from "../models/order.model.js";

// Minimal Stripe webhook handler
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Set this in your .env
    );
  } catch (err) {
    logger.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log all event types and PaymentIntent IDs for debugging
  const paymentIntentId = event.data?.object?.id || event.data?.object?.payment_intent;
  logger.info(`Stripe webhook event received: ${event.type} for PaymentIntent: ${paymentIntentId}`);

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    logger.info('Webhook received payment_intent.succeeded for PaymentIntent:', paymentIntent.id);

    // Log recent orders for debugging
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    logger.info('Recent orders:', recentOrders.map(o => ({
      id: o._id,
      transactionId: o.paymentDetails?.transactionId,
      paymentStatus: o.paymentStatus
    })));

    // --- DEBUG: Log all guest orders and their transaction IDs ---
    const guestOrders = await Order.find({ guestEmail: { $exists: true, $ne: null } }).sort({ createdAt: -1 }).limit(10);
    logger.info('Recent guest orders:', guestOrders.map(o => ({
      id: o._id,
      transactionId: o.paymentDetails?.transactionId,
      paymentStatus: o.paymentStatus,
      status: o.status,
      guestEmail: o.guestEmail,
      createdAt: o.createdAt
    })));
    // --- END DEBUG ---

    // Try to find the order by PaymentIntent ID
    const order = await Order.findOne({ 'paymentDetails.transactionId': paymentIntent.id });
    if (order) {
      logger.info('Order found for PaymentIntent ID:', paymentIntent.id, 'Order ID:', order._id);
      order.paymentStatus = 'paid';
      order.paymentDetails.status = paymentIntent.status;
      order.paymentDetails.paymentDate = new Date();
      order.status = 'processing'; // Set order status to processing when paid
      await order.save();
      logger.info('Order payment status updated to paid and order status to processing for order', order._id);
    } else {
      logger.warn('No order found for PaymentIntent ID', paymentIntent.id);
    }
  }
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    logger.info('PaymentIntent failed!', paymentIntent.id);
    const order = await Order.findOne({ 'paymentDetails.transactionId': paymentIntent.id });
    if (order) {
      order.paymentStatus = 'failed';
      order.paymentDetails.status = paymentIntent.status;
      await order.save();
      logger.info('Order payment status updated to failed for order', order._id);
    } else {
      logger.warn('No order found for PaymentIntent ID', paymentIntent.id);
    }
  }
  if (event.type === 'payment_intent.canceled') {
    const paymentIntent = event.data.object;
    logger.info('PaymentIntent was canceled!', paymentIntent.id);
    const order = await Order.findOne({ 'paymentDetails.transactionId': paymentIntent.id });
    if (order) {
      order.paymentStatus = 'cancelled';
      order.paymentDetails.status = paymentIntent.status;
      order.status = 'cancelled'; // Also update main order status
      await order.save();
      logger.info('Order payment status and order status updated to cancelled for order', order._id);
    } else {
      logger.warn('No order found for PaymentIntent ID', paymentIntent.id);
    }
  }
  if (event.type === 'charge.refunded' || event.type === 'payment_intent.amount_refunded') {
    // Stripe sends different shapes for these events
    let paymentIntentId = null;
    let amountRefunded = 0;
    let totalAmount = 0;
    if (event.type === 'charge.refunded') {
      paymentIntentId = event.data.object.payment_intent;
      amountRefunded = event.data.object.amount_refunded;
      totalAmount = event.data.object.amount;
    } else if (event.type === 'payment_intent.amount_refunded') {
      paymentIntentId = event.data.object.id;
      amountRefunded = event.data.object.amount_refunded;
      totalAmount = event.data.object.amount;
    }
    if (paymentIntentId) {
      const order = await Order.findOne({ 'paymentDetails.transactionId': paymentIntentId });
      if (order) {
        if (amountRefunded >= totalAmount) {
          order.paymentStatus = 'refunded';
          order.status = 'refunded'; // Set to 'refunded' for full refund
        } else {
          order.paymentStatus = 'partially_refunded';
          order.status = 'partially_refunded'; // Set to 'partially_refunded' for partial refund
        }
        order.paymentDetails.refundAmount = amountRefunded / 100; // convert to main currency unit
        order.paymentDetails.refundDate = new Date();
        await order.save();
        logger.info('Order payment status and order status updated to refunded/partially_refunded for order', order._id);
      } else {
        logger.warn('No order found for PaymentIntent ID', paymentIntentId);
      }
    }
  }
  // Add more event types as needed

  res.json({ received: true });
};

// Create a SetupIntent for saving a card
export const createSetupIntent = async (req, res) => {
  logger.info('createSetupIntent endpoint was called');
  try {
    const { Consumer } = await import('../models/consumer.model.js');
    let consumer = await Consumer.findById(req.userId);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found" });
    }

    let stripeCustomerId = consumer.stripeCustomerId;
    let stripeCustomer = null;

    if (stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
        if (stripeCustomer.deleted) throw new Error('Customer deleted');
      } catch (err) {
        logger.warn('Stripe customer not found or deleted, creating new customer for consumer:', consumer._id);
        stripeCustomer = await stripe.customers.create({
          email: consumer.email,
          name: consumer.name,
          phone: consumer.phone,
        });
        consumer.stripeCustomerId = stripeCustomer.id;
        await consumer.save();
      }
    } else {
      // No customer ID, create a new one
      stripeCustomer = await stripe.customers.create({
        email: consumer.email,
        name: consumer.name,
        phone: consumer.phone,
      });
      consumer.stripeCustomerId = stripeCustomer.id;
      await consumer.save();
    }

    // Idempotency: reuse last SetupIntent if still valid
    if (consumer.lastSetupIntentId) {
      try {
        const existingIntent = await stripe.setupIntents.retrieve(consumer.lastSetupIntentId);
        if (existingIntent && existingIntent.status === 'requires_confirmation') {
          logger.info('Reusing existing SetupIntent for consumer:', consumer._id);
          return res.json({ clientSecret: existingIntent.client_secret });
        }
      } catch (err) {
        logger.warn('Previous SetupIntent not found or not reusable:', err.message);
      }
    }

    logger.info('Creating SetupIntent for consumer:', consumer._id, 'stripeCustomerId:', consumer.stripeCustomerId);
    const setupIntent = await stripe.setupIntents.create({
      customer: consumer.stripeCustomerId,
    });
    consumer.lastSetupIntentId = setupIntent.id;
    await consumer.save();
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    logger.error("Error in createSetupIntent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 