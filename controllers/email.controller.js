import { sendEmail, renderTemplate } from '../utils/email.js';

// Send test email
export const sendTestEmail = async (req, res) => {
  try {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email (to) is required' });
    }
    const html = await renderTemplate('testEmail', { name });
    await sendEmail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Test Email from Your Backend',
      html,
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
}; 