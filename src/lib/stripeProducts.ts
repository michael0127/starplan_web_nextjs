/**
 * Stripe Products Configuration
 * Maps experience levels to product types and Stripe product IDs
 */

import { ExperienceLevel, ProductType } from '@prisma/client';

// Stripe Product IDs from Stripe Dashboard
export const STRIPE_PRODUCTS = {
  JUNIOR: {
    productId: 'prod_TcmwWtCeq8zV3Z',
    priceId: 'price_1SfXN5FNsxPjNnLXgWKViqTx',
    amount: 3000, // $30.00 AUD in cents
    currency: 'aud',
    name: 'Junior Job Posting',
    description: 'Post a job for entry-level positions (Intern, Junior)',
  },
  SENIOR: {
    productId: 'prod_TcsyqfzZ8A2vRu',
    priceId: 'price_1SfdCTFNsxPjNnLXam3BHQ7m',
    amount: 30000, // $300.00 AUD in cents
    currency: 'aud',
    name: 'Senior Job Posting',
    description: 'Post a job for experienced positions (Mid-level, Senior, Lead, Principal)',
  },
} as const;

/**
 * Maps experience level string to ProductType enum
 * @param experienceLevel - The experience level string from job posting
 * @returns ProductType enum (JUNIOR or SENIOR)
 */
export function getProductTypeFromExperienceLevel(experienceLevel: string): ProductType {
  const level = experienceLevel.toUpperCase() as keyof typeof ExperienceLevel;
  
  // Junior product: INTERN, JUNIOR
  if (level === 'INTERN' || level === 'JUNIOR') {
    return ProductType.JUNIOR;
  }
  
  // Senior product: MID_LEVEL, SENIOR, LEAD, PRINCIPAL
  return ProductType.SENIOR;
}

/**
 * Gets Stripe product configuration based on experience level
 * @param experienceLevel - The experience level string from job posting
 * @returns Stripe product configuration
 */
export function getStripeProductConfig(experienceLevel: string) {
  const productType = getProductTypeFromExperienceLevel(experienceLevel);
  return STRIPE_PRODUCTS[productType];
}

/**
 * Gets Stripe product configuration based on ProductType enum
 * @param productType - The ProductType enum
 * @returns Stripe product configuration
 */
export function getStripeProductConfigByType(productType: ProductType) {
  return STRIPE_PRODUCTS[productType];
}

/**
 * Formats amount in cents to display currency
 * @param amountInCents - Amount in cents
 * @param currency - Currency code (default: 'aud')
 * @returns Formatted currency string
 */
export function formatCurrency(amountInCents: number, currency: string = 'aud'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}




