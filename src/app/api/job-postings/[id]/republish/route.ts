/**
 * Republish Job Posting API
 * PATCH /api/job-postings/[id]/republish
 * Changes an archived job posting back to PUBLISHED if not expired
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { isJobPostingExpired } from '@/lib/jobPostingExpiry';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create a Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobPostingId } = await params;

    // Get the job posting with purchase info
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: {
        id: true,
        userId: true,
        status: true,
        purchase: {
          select: {
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
        { error: 'Forbidden: You do not own this job posting' },
        { status: 403 }
      );
    }

    // Only allow republishing of ARCHIVED jobs
    if (jobPosting.status !== JobStatus.ARCHIVED) {
      return NextResponse.json(
        { error: 'Only archived jobs can be republished' },
        { status: 400 }
      );
    }

    // Check if the job posting has expired
    const expired = await isJobPostingExpired(jobPostingId);
    if (expired) {
      return NextResponse.json(
        { error: 'Cannot republish expired job posting. The 30-day validity period has ended.' },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (!jobPosting.purchase || jobPosting.purchase.paymentStatus !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Cannot republish job posting without successful payment' },
        { status: 400 }
      );
    }

    // Republish the job posting
    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status: JobStatus.PUBLISHED,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job posting republished successfully',
      data: updatedJobPosting,
    });
  } catch (error) {
    console.error('Error republishing job posting:', error);
    return NextResponse.json(
      { error: 'Failed to republish job posting' },
      { status: 500 }
    );
  }
}
