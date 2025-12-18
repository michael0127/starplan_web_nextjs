/**
 * Stripe Webhook Handler
 * Handles Stripe events like payment success, failure, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, JobStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const jobPostingId = session.metadata?.jobPostingId;

  if (!jobPostingId) {
    console.error('No jobPostingId in session metadata');
    return;
  }

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await prisma.jobPostingPurchase.update({
      where: { jobPostingId },
      data: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: now,
        expiresAt: expiresAt,
      },
    });

    // Update job posting status to PUBLISHED if payment succeeded
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status: JobStatus.PUBLISHED,
      },
    });

    console.log(`Payment succeeded for job posting: ${jobPostingId}, expires at: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const jobPostingId = session.metadata?.jobPostingId;

  if (!jobPostingId) {
    console.error('No jobPostingId in session metadata');
    return;
  }

  try {
    await prisma.jobPostingPurchase.update({
      where: { jobPostingId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    console.log(`Checkout session expired for job posting: ${jobPostingId}`);
  } catch (error) {
    console.error('Error handling checkout session expired:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const purchase = await prisma.jobPostingPurchase.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    if (purchase) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await prisma.jobPostingPurchase.update({
        where: { id: purchase.id },
        data: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          paidAt: now,
          expiresAt: expiresAt,
        },
      });

      // Update job posting status to PUBLISHED
      await prisma.jobPosting.update({
        where: { id: purchase.jobPostingId },
        data: {
          status: JobStatus.PUBLISHED,
        },
      });

      console.log(`Payment intent succeeded: ${paymentIntent.id}, expires at: ${expiresAt.toISOString()}`);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const purchase = await prisma.jobPostingPurchase.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    if (purchase) {
      await prisma.jobPostingPurchase.update({
        where: { id: purchase.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      console.log(`Payment intent failed: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const purchase = await prisma.jobPostingPurchase.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    if (purchase) {
      await prisma.jobPostingPurchase.update({
        where: { id: purchase.id },
        data: {
          paymentStatus: PaymentStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      console.log(`Payment intent canceled: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment intent canceled:', error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string;
    
    const purchase = await prisma.jobPostingPurchase.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (purchase) {
      await prisma.jobPostingPurchase.update({
        where: { id: purchase.id },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
        },
      });

      // Optionally update job posting status
      await prisma.jobPosting.update({
        where: { id: purchase.jobPostingId },
        data: {
          status: JobStatus.ARCHIVED,
        },
      });

      console.log(`Charge refunded: ${charge.id}`);
    }
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}




