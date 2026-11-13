const nodemailer = require("nodemailer");
const { Resend } = require("resend");

let testSenderOverride = null;

/**
 * Returns the configured 'from' email address
 */
const getEmailFrom = () => {
  return process.env.EMAIL_FROM || "office.studyguru@gmail.com";
};

/**
 * Creates or retrieves a nodemailer transporter when SMTP credentials or Gmail App Password is provided
 */
const getTransporter = () => {
  const fromEmail = getEmailFrom();
  const rawKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const cleanedPass = rawKey.replace(/\s+/g, "");

  // If using Gmail or generic SMTP password (e.g. 16-char app password or explicit SMTP settings)
  if (cleanedPass && !cleanedPass.startsWith("re_")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromEmail,
        pass: cleanedPass,
      },
    });
  }

  // If explicit SMTP_HOST is defined
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || fromEmail,
        pass: process.env.SMTP_PASS || cleanedPass,
      },
    });
  }

  return null;
};

/**
 * Retrieves Resend client if a valid Resend API key (re_...) is configured
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey.trim().startsWith("re_")) {
    return new Resend(apiKey.trim());
  }
  return null;
};

/**
 * Unified email sending function supporting Gmail SMTP (Nodemailer) and Resend API
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @param {string} [options.from]
 * @returns {Promise<{success: boolean, messageId?: string, error?: any}>}
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
  if (testSenderOverride) {
    return await testSenderOverride({ to, subject, html, text, from });
  }

  const sender = from || getEmailFrom();
  const toList = Array.isArray(to) ? to : [to];

  // 1. Try Gmail / SMTP via Nodemailer
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Library Management System" <${sender}>`,
        to: toList.join(", "),
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " ").trim(),
      });
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.error("Nodemailer SMTP delivery failed:", smtpErr.message);
      // Fall through to try Resend if configured
    }
  }

  // 2. Try Resend if configured with valid re_ key
  const resendClient = getResendClient();
  if (resendClient) {
    try {
      const result = await resendClient.emails.send({
        from: sender,
        to: toList,
        subject,
        html,
        text,
      });
      if (result.error) {
        throw new Error(result.error.message || "Resend API error");
      }
      return { success: true, messageId: result.data?.id };
    } catch (resendErr) {
      console.error("Resend delivery failed:", resendErr.message);
      throw resendErr;
    }
  }

  if (!transporter && !resendClient) {
    const errMsg = "Email service not configured. Please check EMAIL_FROM and RESEND_API_KEY/SMTP settings in .env.";
    console.warn("⚠️ " + errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Test helper to override email sending in unit/integration tests
 */
const _setEmailSenderForTest = (senderFn) => {
  testSenderOverride = senderFn;
};

module.exports = {
  getEmailFrom,
  getTransporter,
  getResendClient,
  sendEmail,
  _setEmailSenderForTest,
};

