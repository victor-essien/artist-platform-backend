import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Generate a unique QR code for tickets
 */
export const generateQRCode = (): string => {
  return `TKT-${uuidv4()}`;
};

/**
 * Generate a unique SKU
 */
export const generateSKU = (prefix: string = 'PROD'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Calculate shipping fee based on weight and location
 */
export const calculateShippingFee = (
  weight: number,
  country: string
): number => {
  // Simple calculation - adjust based on your shipping provider
  const baseRate = country === 'USA' ? 5.99 : 15.99;
  const weightRate = Math.ceil(weight / 1000) * 2; // $2 per kg
  return baseRate + weightRate;
};

/**
 * Calculate tax based on subtotal and location
 */
export const calculateTax = (subtotal: number, state?: string): number => {
  // Simple tax calculation - adjust based on your tax rules
  const taxRates: { [key: string]: number } = {
    CA: 0.0725, // California
    NY: 0.04, // New York
    TX: 0.0625, // Texas
    // Add more states as needed
  };

  const taxRate = state && taxRates[state] ? taxRates[state] : 0;
  return subtotal * taxRate;
};

/**
 * Format price to 2 decimal places
 */
export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

/**
 * Generate a random password
 */
export const generatePassword = (length: number = 12): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Check if event is upcoming
 */
export const isUpcomingEvent = (eventDate: Date): boolean => {
  return new Date(eventDate) > new Date();
};

/**
 * Check if sales are active for a ticket type
 */
export const isSalesActive = (
  salesStart?: Date | null,
  salesEnd?: Date | null
): boolean => {
  const now = new Date();
  const startOk = !salesStart || new Date(salesStart) <= now;
  const endOk = !salesEnd || new Date(salesEnd) >= now;
  return startOk && endOk;
};

/**
 * Paginate results
 */
export const paginate = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};