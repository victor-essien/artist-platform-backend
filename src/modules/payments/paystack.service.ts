import { paystackApi } from "./paystack";
import logger from "../../utils/logger";
import { AppError } from "../../utils/error";

interface InitializePaymentParams {
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
  metadata?: any;
  callback_url?: string;
  channels?: string[];
}

interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

interface RefundPaymentParams {
  transaction: string | number; // transaction reference or ID
  amount?: number; // optional, full refund if not specified
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}


export class PaystackService {
    /**
     * Initialize a payment transaction
     */

    async initializePayment (
        params: InitializePaymentParams
    ): Promise<InitializePaymentResponse> {
    try {
        // Convert amount to smallest currency unit (kobo for NGN)
        const amountInKobo = Math.round(params.amount * 100);

        const response = await paystackApi.post<InitializePaymentResponse>(
            '/transaction/initialize',
            {
                email: params.email,
                amount: amountInKobo,
                reference: params.reference,
                currency: params.currency || 'NGN',
                metadata: params.metadata,
                callback_url: params.callback_url,
                channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
            }
        );
        logger.info(`Paystack payment initialized: ${response.data.data.reference}`);
      return response.data;
    } catch (error: any) {
         logger.error('Paystack initialization error:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Payment initialization failed',
        400
      );
    }
    }

    /**
     * Verify a paymnet transaction
     */
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await paystackApi.get<VerifyPaymentResponse>(
        `/transaction/verify/${reference}`
      );

      logger.info(`Paystack payment verified: ${reference} - Status: ${response.data.data.status}`);
      return response.data;
    } catch (error: any) {
      logger.error('Paystack verification error:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Payment verification failed',
        400
      );
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: number | string): Promise<any> {
    try {
        const response = await paystackApi.get(`/transaction/${transactionId}`)
        return response.data;
    } catch (error: any) {
         logger.error('Paystack get transaction error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch transaction details', 400);
    }
  }

  /**
   * List all transactions
   */
  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
    amount?: number;
  }): Promise<any> {
    try {
      const response = await paystackApi.get('/transaction', { params });
      return response.data;
    } catch (error: any) {
      logger.error('Paystack list transactions error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch transactions', 400);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Convert amount from Naira to Kobo (or other currency to smallest unit)
   */
  convertToKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from Kobo to Naira (or other currency from smallest unit)
   */
  convertFromKobo(amount: number): number {
    return amount / 100;
  }

  /**
   * Get supported banks
   */
  async getBanks(country: string = 'nigeria'): Promise<any> {
    try {
      const response = await paystackApi.get('/bank', {
        params: { country },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Paystack get banks error:', error.response?.data || error.message);
      throw new AppError('Failed to fetch banks', 400);
    }
  }
}

export default new PaystackService();