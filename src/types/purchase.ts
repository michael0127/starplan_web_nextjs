/**
 * Purchase related types for job postings
 */

import { ProductType, PaymentStatus } from '@prisma/client';

export interface CreatePurchaseData {
  jobPostingId: string;
  userId: string;
  experienceLevel: string;
}

export interface PurchaseResponse {
  purchaseId: string;
  clientSecret?: string;
  sessionId?: string;
  amount: number;
  currency: string;
  productType: ProductType;
  status: PaymentStatus;
}

export interface StripeCheckoutSessionData {
  jobPostingId: string;
  experienceLevel: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      payment_intent?: string;
      customer?: string;
      metadata?: Record<string, string>;
      amount_total?: number;
      currency?: string;
      payment_status?: string;
      status?: string;
    };
  };
}




