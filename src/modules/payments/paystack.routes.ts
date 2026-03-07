import {Router} from 'express';
import {body} from 'express-validator';
import {PaystackController} from './paystack.controller';
import {authenticate} from '../../middleware/auth';
import {validate} from '../../middleware/validator';

const paystackRouter = Router();
const paystackController = new PaystackController();

/**
 * @route   POST /api/paystack/initialize
 * @desc    Initialize Paystack payment
 * @access  Public
 */
paystackRouter.post(
  '/initialize',
  validate([
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('currency').optional().isString(),
    body('callback_url').optional().isURL(),
  ]),
  paystackController.initializePayment.bind(paystackController)
);

/**
 * @route   GET /api/paystack/verify/:reference
 * @desc    Verify Paystack payment
 * @access  Public
 */
paystackRouter.get(
  '/verify/:reference',
  paystackController.verifyPayment.bind(paystackController)
);

/**
 * @route   POST /api/paystack/webhook
 * @desc    Handle Paystack webhook events
 * @access  Public (validated by signature)
 */
paystackRouter.post(
  '/webhook',
  paystackController.handleWebhook.bind(paystackController)
);

/**
 * @route   GET /api/paystack/public-key
 * @desc    Get Paystack public key
 * @access  Public
 */
paystackRouter.get(
  '/public-key',
  paystackController.getPublicKey.bind(paystackController)
);


/**
 * @route   GET /api/paystack/transaction/:reference
 * @desc    Get transaction details
 * @access  Private (Admin)
 */
paystackRouter.get(
  '/transaction/:reference',
  authenticate,
  paystackController.getTransaction.bind(paystackController)
);


/**
 * @route   GET /api/paystack/transactions
 * @desc    List all transactions
 * @access  Private (Admin)
 */
paystackRouter.get(
  '/transactions',
  authenticate,
  paystackController.listTransactions.bind(paystackController)
);

export default paystackRouter;