import dotenv from 'dotenv';
dotenv.config();
import nodemailer from "nodemailer";
import mjml2html from "mjml";
import fs from 'fs/promises';
import mustache from 'mustache';
import path from 'path';

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
 * Send an email with HTML content
 * @param {Object} options
 * @param {string} options.from - Sender email address
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content (already rendered)
 */
export async function sendEmail({ from, to, subject, html }) {
  try {
    const mailOptions = {
      from: from || process.env.SMTP_USER,
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

/**
 * Render MJML template with data
 * @param {string} templateName - Name of the template file (without .mjml extension)
 * @param {Object} data - Data to inject into the template
 * @returns {string} Rendered HTML
 */
export async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(process.cwd(), 'emailTemplates', `${templateName}.mjml`);
    const mjmlTemplate = await fs.readFile(templatePath, 'utf-8');

    
    // Render template with data using Mustache
    const mjmlWithData = mustache.render(mjmlTemplate, data);

    
    // Clean the MJML string and convert to HTML
    const cleanMjmlTemplate = mjmlWithData
      .replace(/^\uFEFF/, '') // Remove BOM
      .trim(); // Remove whitespace
    
    const { html, errors } = mjml2html(cleanMjmlTemplate);
    
    if (errors && errors.length > 0) {
      console.error("MJML compilation errors:", errors);
      throw new Error("MJML compilation error: " + JSON.stringify(errors));
    }
    
    return html;
  } catch (error) {
    console.error("Error rendering template:", error);
    throw error;
  }
}

/**
 * Send a new login alert email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - User's name
 * @param {string} options.ip - IP address
 * @param {string} options.city - City
 * @param {string} options.country - Country
 * @param {string} options.timestamp - Date/time string
 * @param {string} options.resetLink - Password reset link
 */
export async function sendNewLoginAlertEmail({ to, name, ip, city, country, timestamp, resetLink }) {
  const html = await renderTemplate("newLoginAlert", { name, ip, city, country, timestamp, resetLink });
  return sendEmail({ to, subject: "New Login Detected", html });
}