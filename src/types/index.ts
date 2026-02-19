import { Request } from "express";



export interface IAdminPayload {
    id: string;
    email: string;  
    role: string;
    iat?: number;
    exp?: number;
}


export interface AuthRequest extends Request {
    admin?: IAdminPayload;
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
}


export interface EventFilterQuery extends PaginationQuery {
    status?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
}

export interface  ProductFilterQuery extends PaginationQuery {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
}


export interface OrderFilterQuery extends PaginationQuery {
    status?: string;
    orderType?: string;
    startDate?: string;
    endDate?: string;
    customerEmail?: string;
}

export interface CreateEventDTD {
    title: string;
    description: string;
    venue: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    date: Date;
    startTime: string;
    endTime?: string;
    imageUrl?: string;
    totalSeats: number;
    ticketTypes: CreateTicketTypeDTO[];
}

export interface CreateTicketTypeDTO {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    maxPerOrder?: number;
    salesStart?: Date;
    salesEnd?: Date;
}


export interface CreateProductDTD {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    stock: number;
    sku?: string;
    weight?: number;
    variants?: CreateProductVariantDTO[];
}

export interface CreateProductVariantDTO {
    name: string;
    sku?: string;
    price: number;
    stock: number;
}

export interface CreateOrderDTO {
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    orderType: 'TICKET' | 'MERCH' | 'MIXED';
    eventId?: string;
    items: OrderItemDTD[];
    tickets?: TicketPurchaseDTO[];
    shippingAddress?: ShippingAddressDTO;
    paymentMethod: string
}

export interface OrderItemDTD {
    productId: string;
    productVariantId?: string;
    quantity: number;
}

export interface TicketPurchaseDTO {
  ticketTypeId: string;
  quantity: number;
}

export interface ShippingAddressDTO {
  address: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
}

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalTicketsSold: number;
  totalMerchSold: number;
  averageOrderValue: number;
}

export interface TopProducts {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface TopEvents {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  revenue: number;
}