/**
 * Job Posting Expiry Info API
 * GET /api/job-postings/[id]/expiry
 * Returns expiry information for a specific job posting
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDaysUntilExpiry, isJobPostingExpired } from '@/lib/jobPostingExpiry';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobPostingId } = await params;

    // Get job posting with purchase info
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        purchase: {
          select: {
            paidAt: true,
            expiresAt: true,
            paymentStatus: true,
          },
        },
      },
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
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate expiry info
    const isExpired = await isJobPostingExpired(jobPostingId);
    const daysRemaining = await getDaysUntilExpiry(jobPostingId);

    return NextResponse.json({
      jobPostingId,
      status: jobPosting.status,
      purchase: jobPosting.purchase ? {
        paidAt: jobPosting.purchase.paidAt,
        expiresAt: jobPosting.purchase.expiresAt,
        paymentStatus: jobPosting.purchase.paymentStatus,
      } : null,
      expiry: {
        isExpired,
        daysRemaining,
        hasExpiry: jobPosting.purchase?.expiresAt != null,
      },
    });
  } catch (error) {
    console.error('Error getting job posting expiry:', error);
    return NextResponse.json(
      { error: 'Failed to get expiry information' },
      { status: 500 }
    );
  }
}

