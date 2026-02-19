import nodemailer from "nodemailer";
import logger from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

export const sendOrderConfirmation = async (
  email: string,
  orderNumber: string,
  orderDetails: any
): Promise<void> => {
  const subject = `Order Confirmation - ${orderNumber}`;
  const html = `
    <h1>Thank you for your order!</h1>
    <p>Order Number: <strong>${orderNumber}</strong></p>
    <p>We've received your order and will process it shortly.</p>
    <h2>Order Details:</h2>
    <p>Total: $${orderDetails.total}</p>
    <p>You'll receive another email once your order ships.</p>
  `;

  await sendEmail({ to: email, subject, html });
};

export const sendTicketConfirmation = async (
  email: string,
  orderNumber: string,
  eventDetails: any,
  ticketCount: number
): Promise<void> => {
  const subject = `Ticket Confirmation - ${eventDetails.title}`;
  const html = `
    <h1>Your tickets are confirmed!</h1>
    <p>Order Number: <strong>${orderNumber}</strong></p>
    <h2>Event Details:</h2>
    <p><strong>${eventDetails.title}</strong></p>
    <p>Date: ${new Date(eventDetails.date).toLocaleDateString()}</p>
    <p>Venue: ${eventDetails.venue}</p>
    <p>Number of Tickets: ${ticketCount}</p>
    <p>Your QR codes are attached. Please present them at the venue.</p>
  `;

  await sendEmail({ to: email, subject, html });
};

export const sendRefundConfirmation = async (
  email: string,
  orderNumber: string,
  refundAmount: number
): Promise<void> => {
  const subject = `Refund Processed - ${orderNumber}`;
  const html = `
    <h1>Refund Processed</h1>
    <p>Order Number: <strong>${orderNumber}</strong></p>
    <p>A refund of $${refundAmount} has been processed to your original payment method.</p>
    <p>Please allow 5-10 business days for the refund to appear in your account.</p>
  `;

  await sendEmail({ to: email, subject, html });
};
