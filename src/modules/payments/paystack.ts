import axios from 'axios';
import logger from '../../utils/logger';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Verify Paystack configuration
const verifyPaystackConfig = () => {
  if (!PAYSTACK_SECRET_KEY) {
    logger.warn('Paystack secret key is not configured. Paystack payments will not work.');
    return false;
  }
  
  if (PAYSTACK_SECRET_KEY.startsWith('sk_test_')) {
    logger.info('Paystack configured in TEST mode');
  } else if (PAYSTACK_SECRET_KEY.startsWith('sk_live_')) {
    logger.info('Paystack configured in LIVE mode');
  } else {
    logger.warn('Invalid Paystack secret key format');
    return false;
  }
  
  return true;
};

verifyPaystackConfig();


// Axios instance for Paystack API
export const paystackApi = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
}
})



export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
export const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';
