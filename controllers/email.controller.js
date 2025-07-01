import { sendEmail, renderTemplate } from '../utils/email.js';

export const sendVerificationEmail = async (to, verificationToken, name) => {
  const verificationLink = 'http://localhost:8000/account-verify';
  const html = await renderTemplate('verificationEmail', { verificationToken, name, verificationLink });
  return sendEmail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Verify your email',
    html,
  });
};

export const sendWelcomeEmail = async (to, name) => {
  const html = await renderTemplate('welcome', { name });
  return sendEmail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Welcome to FreshFarm!',
    html,
  });
};

export const sendResetPasswordEmail = async (to, name, tempPassword, resetLink, expirationTime) => {
  const html = await renderTemplate('resetPasswordEmail', {
    name,
    tempPassword,
    resetLink,
    expirationTime
  });
  return sendEmail({
    from: process.env.SMTP_USER,
    to,
    subject: 'FreshFarm - Password Reset Request',
    html,
  });
};

export const sendOrderConfirmationEmail = async (to, name, order) => {
  const plainOrder = JSON.parse(JSON.stringify(order));
  // Flatten farmer info for each orderItem
  if (plainOrder.orderItems) {
    plainOrder.orderItems.forEach(orderItem => {
      // Flatten farmer info from the first product
      const firstProduct = orderItem.products[0];
      orderItem.farmerName = firstProduct?.product?.farmer?.name || '';
      orderItem.farmName = firstProduct?.product?.farmer?.farmName || '';
      orderItem.products = orderItem.products.map(p => ({
        name: p.product?.name,
        imagePath: p.product?.imagePath,
        measurement: p.product?.measurement,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        subtotal: p.subtotal
      }));
    });
  }
  console.log('DEBUG plainOrder for email:', JSON.stringify(plainOrder, null, 2));
  const html = await renderTemplate('orderConfirmEmail', { name, order: plainOrder });
  return sendEmail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Your Order Confirmation - FreshFarm',
    html,
  });
}; 