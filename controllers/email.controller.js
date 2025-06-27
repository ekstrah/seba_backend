import { sendEmail } from '../utils/email.js';

// Send test email
export const sendTestEmail = async (req, res) => {
  console.log("BODY RECEIVED:", req.body); // Debug log
  try {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email (to) is required' });
    }
    // Simple MJML template inline for test
    const mjml = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="20px" color="#333">Hello${name ? ', ' + name : ''}!</mj-text>
              <mj-text>This is a test email from your backend using nodemailer-mjml.</mj-text>
              <mj-divider border-color="#F45E43" />
              <mj-text>If you received this, your email setup works!</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;
    await sendEmail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Test Email from Your Backend',
      mjml,
      context: { name: name || '' },
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
}; 