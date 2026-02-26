import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import adminRouter from './modules/admin/admin.routes';
import eventRouter from './modules/events/event.routes';
import productRouter from './modules/products/product.routes';
import orderRouter from './modules/orders/order.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import { errorHandler, notFound } from './middleware/errorHandler';
const app = express();


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.status(200).send('Artist Platform API!');
});
 
// API Routes
app.use('/api/admin', adminRouter);
app.use('/api/events', eventRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/analytics', analyticsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;