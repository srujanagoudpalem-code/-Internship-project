export type UserRole = 'ADMIN' | 'SUPPORT_EXECUTIVE' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  purchaseDate: string;
  deliveryDate?: string | null;
  status: string;
  orderItems: OrderItem[];
}

export type IssueType =
  | 'DAMAGED_PRODUCT'
  | 'WRONG_CUSTOMIZATION'
  | 'MISSING_ITEMS'
  | 'LATE_DELIVERY'
  | 'WRONG_PRODUCT'
  | 'REPLACEMENT_REQUEST'
  | 'REFUND_REQUEST';

export type PreferredResolution = 'REFUND' | 'REPLACEMENT';

export type RequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REPLACEMENT_INITIATED'
  | 'REPLACEMENT_SHIPPED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'CLOSED';

export interface ReturnImage {
  id: string;
  returnRequestId: string;
  imageUrl: string;
  publicId?: string | null;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  returnRequestId: string;
  status: RequestStatus;
  note?: string | null;
  createdById: string;
  createdBy: {
    name: string;
    role: { name: UserRole };
  };
  createdAt: string;
}

export interface Comment {
  id: string;
  returnRequestId: string;
  userId: string;
  user: {
    name: string;
    role: { name: UserRole };
  };
  commentText: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  order: Order;
  customerName: string;
  email: string;
  phone: string;
  issueType: IssueType;
  issueDescription: string;
  preferredResolution: PreferredResolution;
  status: RequestStatus;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  images: ReturnImage[];
  statusHistory?: StatusHistory[];
  comments?: Comment[];
}

export interface DashboardStats {
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    underReview: number;
    today: number;
  };
  statusDistribution: { name: string; count: number }[];
  issueTypeDistribution: { name: string; count: number }[];
  resolutions: { name: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  recentActivity: {
    id: string;
    requestId: string;
    customerName: string;
    orderNumber: string;
    status: string;
    note: string;
    updatedBy: string;
    role: string;
    createdAt: string;
  }[];
}
