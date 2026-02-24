# Artist Platform Backend API

A comprehensive backend system for an artist platform featuring ticketing, merchandise store, and admin panel with JWT authentication.

## 🚀 Features

### Core Systems
- **Ticketing System**: Complete event management with multiple ticket types, QR code generation, and check-in tracking
- **Merch Store**: Product catalog with variants, inventory management, and order processing
- **Admin Panel**: Secure authentication with role-based access control (SUPER_ADMIN, ADMIN, MODERATOR)
- **No Buyer Registration**: Purchases are tied to email only - streamlined checkout experience

### Operational Features

#### Events & Ticketing
- Create, update, publish, and cancel events
- Multiple ticket types per event with individual pricing
- Sales period management (start/end dates)
- Maximum tickets per order limits
- Real-time inventory tracking
- QR code generation for tickets
- Ticket validation and check-in
- Event statistics and reporting
- Automatic refunds on event cancellation

#### Merchandise Store
- Product CRUD operations with rich descriptions
- Product variants (size, color, etc.)
- Category management
- Stock tracking and low-stock alerts
- Featured products
- SKU management
- Product statistics (sales, revenue)
- Soft delete for products with orders

#### Order Management
- Unified order system for tickets and merch
- Guest checkout (email-only purchases)
- Automatic order number generation
- Order status tracking (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- Payment status tracking
- Shipping fee calculation
- Tax calculation by state
- Order history by customer email
- Refund processing with stock restoration
- Email notifications (order confirmation, ticket delivery, refund)

#### Admin Panel
- JWT-based authentication
- Role-based access control
- Admin user management
- Password change functionality
- Activity logging (who did what, when)
- Profile management

#### Analytics & Reporting
- Dashboard statistics
- Sales metrics (revenue, orders, average order value)
- Top-selling products
- Top-performing events
- Monthly revenue breakdown
- Customer insights (repeat rate, top customers)
- Real-time metrics

#### Security & Performance
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request validation
- Error handling and logging
- Database query optimization
- Transaction support for data consistency

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Payment**: Stripe (ready for integration)
- **Logging**: Winston
- **Security**: Helmet, bcryptjs
- **Validation**: express-validator

## 📁 Project Structure

```
artist-platform-backend/
│
├── 📁 prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── migrations/
│   │   └── 20260219182628_init/
│   │       └── migration.sql      # Initial database migration
│   └── migration_lock.toml        # Migration lock file
│
├── 📁 src/
│   ├── 📁 config/
│   │   └── database.ts            # Prisma client configuration
│   │
│   ├── 📁 generated/
│   │   └── prisma/                # Generated Prisma client
│   │
│   ├── 📁 middleware/
│   │   ├── auth.ts                # JWT authentication & role-based authorization
│   │   ├── errorHandler.ts        # Global error handling middleware
│   │   └── validator.ts           # Request validation middleware
│   │
│   ├── 📁 modules/
│   │   ├── 📁 admin/
│   │   │   ├── admin.routes.ts    # Admin routes
│   │   │   ├── admin.controller.ts # Admin request handlers
│   │   │   └── admin.service.ts   # Admin business logic
│   │   │
│   │   ├── 📁 analytics/
│   │   │   ├── analytics.routes.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── 📁 events/
│   │   │   ├── event.routes.ts
│   │   │   ├── event.controller.ts
│   │   │   └── event.service.ts
│   │   │
│   │   ├── 📁 orders/
│   │   │   ├── order.routes.ts
│   │   │   ├── order.controller.ts
│   │   │   └── order.service.ts
│   │   │
│   │   ├── 📁 payments/
│   │   │   └── (payment integration)
│   │   │
│   │   ├── 📁 products/
│   │   │   ├── product.routes.ts
│   │   │   ├── product.controller.ts
│   │   │   └── product.service.ts
│   │   │
│   │   └── 📁 tickets/
│   │       └── (ticket management)
│   │
│   ├── 📁 types/
│   │   └── index.ts               # TypeScript interfaces & type definitions
│   │
│   ├── 📁 utils/
│   │   ├── email.ts               # Email sending & templates
│   │   ├── error.ts               # Custom error classes
│   │   ├── hash.ts                # Password hashing utilities
│   │   ├── helper.ts              # Helper functions (pagination, SKU generation, etc.)
│   │   ├── jwt.ts                 # JWT token generation & verification
│   │   └── logger.ts              # Winston logger configuration
│   │
│   ├── 📁 services/               # (Optional shared services)
│   │
│   ├── app.ts                     # Express app configuration & middleware setup
│   ├── index.ts                   # Entry point
│   └── server.ts                  # Server startup
│
├── 📁 logs/
│   ├── error.log                  # Error-level logs
│   └── combined.log               # All logs
│
├── 📄 .env                        # Environment variables (local)
├── 📄 .gitignore                  # Git ignore rules
├── 📄 package.json                # Dependencies & scripts
├── 📄 prisma.config.ts            # Prisma configuration
├── 📄 README.md                   # Project documentation
├── 📄 tsconfig.json               # TypeScript configuration

```


## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd artist-platform-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/artist_platform"
JWT_SECRET="your-super-secret-jwt-key"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
STRIPE_SECRET_KEY="sk_test_..."
```

4. **Set up the database**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run seed
```

5. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:4000`

### Production Build
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Admin Routes

#### Register Admin (SUPER_ADMIN only)
```http
POST /api/admin/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "ADMIN"
}
```

#### Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "admin": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Profile
```http
GET /api/admin/profile
Authorization: Bearer <token>
```

#### Change Password
```http
PUT /api/admin/change-password
Authorization: Bearer <token>

{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### Event Routes

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>

{
  "title": "Summer Concert",
  "description": "Amazing summer concert",
  "venue": "City Arena",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "date": "2026-07-15",
  "startTime": "19:00",
  "endTime": "23:00",
  "totalSeats": 5000,
  "ticketTypes": [
    {
      "name": "General Admission",
      "price": 50.00,
      "quantity": 3000,
      "maxPerOrder": 10
    }
  ]
}
```

#### Get All Events
```http
GET /api/events?page=1&limit=10&status=PUBLISHED&city=New York
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Publish Event
```http
POST /api/events/:id/publish
Authorization: Bearer <token>
```

#### Cancel Event
```http
POST /api/events/:id/cancel
Authorization: Bearer <token>
```

#### Get Event Statistics
```http
GET /api/events/:id/stats
Authorization: Bearer <token>
```

### Product Routes

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>

{
  "name": "Tour T-Shirt",
  "description": "Official tour merchandise",
  "price": 29.99,
  "category": "Apparel",
  "stock": 500,
  "weight": 200
}
```

#### Get All Products
```http
GET /api/products?page=1&limit=20&category=Apparel&inStock=true
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Update Stock
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>

{
  "quantity": 100,
  "variantId": "optional-variant-id"
}
```

#### Get Featured Products
```http
GET /api/products/featured
```

#### Get Categories
```http
GET /api/products/categories
```

### Order Routes

#### Create Order
```http
POST /api/orders

{
  "customerEmail": "customer@example.com",
  "customerName": "John Smith",
  "customerPhone": "+1234567890",
  "orderType": "MIXED",
  "eventId": "event-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ],
  "tickets": [
    {
      "ticketTypeId": "ticket-type-uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "paymentMethod": ""
}
```

#### Get All Orders
```http
GET /api/orders?page=1&limit=20&status=CONFIRMED&orderType=TICKET
Authorization: Bearer <token>
```

#### Get Order by Number
```http
GET /api/orders/number/:orderNumber
```

#### Get Customer Orders
```http
GET /api/orders/customer/:email
```

#### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>

{
  "status": "SHIPPED"
}
```

#### Process Payment
```http
POST /api/orders/:id/payment
Authorization: Bearer <token>

{
  "paymentIntentId": "pi_stripe_payment_intent"
}
```

#### Refund Order
```http
POST /api/orders/:id/refund
Authorization: Bearer <token>
```

### Analytics Routes

#### Get Dashboard Statistics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

#### Get Sales Metrics
```http
GET /api/analytics/sales?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer <token>
```

#### Get Top Products
```http
GET /api/analytics/top-products?limit=10
Authorization: Bearer <token>
```

#### Get Top Events
```http
GET /api/analytics/top-events?limit=10
Authorization: Bearer <token>
```

#### Get Revenue by Month
```http
GET /api/analytics/revenue/2026
Authorization: Bearer <token>
```

#### Get Customer Insights
```http
GET /api/analytics/customers
Authorization: Bearer <token>
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Multiple admin roles
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: express-validator for all inputs
- **SQL Injection Prevention**: Prisma ORM
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Controlled cross-origin access
- **Activity Logging**: Track admin actions

## 📧 Email Templates

The system sends automated emails for:
- Order confirmation
- Ticket delivery with QR codes
- Refund confirmation


```


## 📊 Database Schema

The database includes the following main tables:
- **admins**: Admin users with role-based permissions
- **events**: Event information and settings
- **ticket_types**: Different ticket tiers per event
- **tickets**: Individual tickets with QR codes
- **products**: Merchandise items
- **product_variants**: Product variations (size, color)
- **orders**: Unified orders for tickets and merch
- **order_items**: Line items for merchandise
- **payments**: Payment transaction records
- **analytics**: Metrics and KPIs
- **admin_activity_logs**: Audit trail

## 🧪 Testing

Default admin credentials (after running seed):
```
Email: admin@artistplatform.com
Password: SuperAdmin123!
```

## 📝 Logging

Logs are stored in the `logs/` directory:
- `error.log`: Error-level logs
- `combined.log`: All logs

## 🚀 Deployment Checklist

- [ ] Set strong `JWT_SECRET` in production
- [ ] Configure production database URL
- [ ] Set up email service credentials
- [ ] Configure Stripe production keys
- [ ] Update `FRONTEND_URL` for CORS
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting appropriately
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts

## 📖 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `SMTP_HOST` | Email server host | - |
| `SMTP_PORT` | Email server port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |
| `EMAIL_FROM` | Sender email address | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `FRONTEND_URL` | Frontend application URL | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |



## 🆘 Support

For issues and questions:
- Check the API documentation above
- Review error logs in `logs/` directory
- Check database connections
- Verify environment variables

