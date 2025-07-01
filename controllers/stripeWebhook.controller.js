import stripe from '../utils/stripe.js';

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
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // TODO: Update your order/payment record as paid
    console.log('PaymentIntent was successful!', paymentIntent.id);
  }
  // Add more event types as needed

  res.json({ received: true });
};

// Create a SetupIntent for saving a card
export const createSetupIntent = async (req, res) => {
  console.log('createSetupIntent endpoint was called');
  try {
    const { Consumer } = await import('../models/consumer.model.js');
    let consumer = await Consumer.findById(req.userId);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found" });
    }
    let createdCustomerId = null;
    // If the user does not have a Stripe customer, create one
    if (!consumer.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: consumer.email,
        name: consumer.name,
        phone: consumer.phone,
      });
      createdCustomerId = stripeCustomer.id;
      consumer.stripeCustomerId = createdCustomerId;
      await consumer.save();
      // Re-fetch to check for race condition
      consumer = await Consumer.findById(req.userId);
      if (consumer.stripeCustomerId && consumer.stripeCustomerId !== createdCustomerId) {
        // Another request already set a different customer, so delete the extra one
        console.warn('Race condition: deleting extra Stripe customer', createdCustomerId);
        await stripe.customers.del(createdCustomerId);
      }
    }
    console.log('Creating SetupIntent for consumer:', consumer._id, 'stripeCustomerId:', consumer.stripeCustomerId);
    const setupIntent = await stripe.setupIntents.create({
      customer: consumer.stripeCustomerId,
    });
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Error in createSetupIntent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 