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
 * Alternative function to send email directly with MJML template
 * @param {Object} options
 * @param {string} options.from - Sender email address
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - MJML template name
 * @param {Object} options.data - Data for template rendering
 */
export async function sendEmailWithTemplate({ from, to, subject, templateName, data }) {
  try {
    const html = await renderTemplate(templateName, data);
    return await sendEmail({ from, to, subject, html });
  } catch (error) {
    console.error("Error sending email with template:", error);
    throw error;
  }
}