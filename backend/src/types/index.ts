import { Request } from 'express';

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  file?: Express.Multer.File;
  files?: any;
}

// Client-compatible TypeScript Enums for SQLite support
export enum IssueType {
  DAMAGED_PRODUCT = 'DAMAGED_PRODUCT',
  WRONG_CUSTOMIZATION = 'WRONG_CUSTOMIZATION',
  MISSING_ITEMS = 'MISSING_ITEMS',
  LATE_DELIVERY = 'LATE_DELIVERY',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  REPLACEMENT_REQUEST = 'REPLACEMENT_REQUEST',
  REFUND_REQUEST = 'REFUND_REQUEST',
}

export enum PreferredResolution {
  REFUND = 'REFUND',
  REPLACEMENT = 'REPLACEMENT',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REPLACEMENT_INITIATED = 'REPLACEMENT_INITIATED',
  REPLACEMENT_SHIPPED = 'REPLACEMENT_SHIPPED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  CLOSED = 'CLOSED',
}
