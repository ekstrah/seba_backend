import nodemailer from "nodemailer";
import mjml2html from "mjml";

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using MJML template
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.mjml - MJML template string
 */
export async function sendEmail({ to, subject, mjml }) {
  try {
    const { html, errors } = mjml2html(mjml);
    if (errors && errors.length > 0) {
      throw new Error("MJML compilation error: " + JSON.stringify(errors));
    }
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
} 