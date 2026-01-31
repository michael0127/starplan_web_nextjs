/**
 * Archive Job Posting API
 * PATCH /api/job-postings/[id]/archive
 * Archives a published job posting (changes status to ARCHIVED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { canModifyJob } from '@/lib/company-access';

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

    // Get the job posting
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this job (own job or OWNER/ADMIN role in company)
    const modifyPermission = await canModifyJob(user.id, jobPosting.userId);
    if (!modifyPermission.allowed) {
      return NextResponse.json(
        { error: modifyPermission.reason || 'Forbidden: You do not have permission to archive this job posting' },
        { status: 403 }
      );
    }

    // Only allow archiving of PUBLISHED or CLOSED jobs
    if (jobPosting.status !== JobStatus.PUBLISHED && jobPosting.status !== JobStatus.CLOSED) {
      return NextResponse.json(
        { error: 'Only published or closed jobs can be archived' },
        { status: 400 }
      );
    }

    // Archive the job posting
    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status: JobStatus.ARCHIVED,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job posting archived successfully',
      data: updatedJobPosting,
    });
  } catch (error) {
    console.error('Error archiving job posting:', error);
    return NextResponse.json(
      { error: 'Failed to archive job posting' },
      { status: 500 }
    );
  }
}
