/**
 * Job Posting Purchase API
 * Creates a Stripe Checkout Session for purchasing job posting products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { getStripeProductConfig } from '@/lib/stripeProducts';
import { ProductType, PaymentStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobPostingId } = await params;
    const body = await request.json();
    const { successUrl, cancelUrl } = body;

    // Get job posting
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { purchase: true },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (jobPosting.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to purchase for this job posting' },
        { status: 403 }
      );
    }

    // Check if already purchased
    if (jobPosting.purchase && jobPosting.purchase.paymentStatus === 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Job posting already purchased' },
        { status: 400 }
      );
    }

    // Get product config based on experience level
    const productConfig = getStripeProductConfig(jobPosting.experienceLevel);
    const productType = jobPosting.experienceLevel.toUpperCase() === 'INTERN' || 
                       jobPosting.experienceLevel.toUpperCase() === 'JUNIOR'
      ? ProductType.JUNIOR
      : ProductType.SENIOR;

    // Create or get Stripe customer
    let customerId = jobPosting.purchase?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
          jobPostingId: jobPostingId,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: productConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true, // Allow customers to enter promotion codes
      success_url: successUrl || `${request.nextUrl.origin}/employer/jobs?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/employer/jobs/new?canceled=true`,
      metadata: {
        jobPostingId: jobPostingId,
        userId: user.id,
        productType: productType,
      },
    });

    // Create or update purchase record
    const purchase = await prisma.jobPostingPurchase.upsert({
      where: { jobPostingId: jobPostingId },
      create: {
        jobPostingId: jobPostingId,
        userId: user.id,
        productType: productType,
        stripeProductId: productConfig.productId,
        stripePriceId: productConfig.priceId,
        stripeCustomerId: customerId,
        stripeSessionId: session.id,
        amount: productConfig.amount,
        currency: productConfig.currency,
        paymentStatus: PaymentStatus.PENDING,
      },
      update: {
        stripeSessionId: session.id,
        stripeCustomerId: customerId,
        paymentStatus: PaymentStatus.PENDING,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      purchaseId: purchase.id,
      sessionId: session.id,
      sessionUrl: session.url,
      amount: productConfig.amount,
      currency: productConfig.currency,
      productType: productType,
      status: PaymentStatus.PENDING,
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get purchase status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobPostingId } = await params;

    // Get purchase record
    const purchase = await prisma.jobPostingPurchase.findUnique({
      where: { jobPostingId: jobPostingId },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      purchaseId: purchase.id,
      jobPostingId: purchase.jobPostingId,
      productType: purchase.productType,
      amount: purchase.amount,
      currency: purchase.currency,
      paymentStatus: purchase.paymentStatus,
      paidAt: purchase.paidAt,
      createdAt: purchase.createdAt,
    });
  } catch (error) {
    console.error('Purchase retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve purchase' },
      { status: 500 }
    );
  }
}




