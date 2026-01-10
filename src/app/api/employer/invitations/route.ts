import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

interface InvitationWithJob {
  id: string;
  token: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string | null;
  status: string;
  message: string | null;
  sentAt: Date;
  viewedAt: Date | null;
  respondedAt: Date | null;
  expiresAt: Date;
  screeningResponses: unknown[];
  jobPosting: {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
  };
}

// GET /api/employer/invitations - Get all invitations across all jobs for the employer
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'pending', 'completed', 'expired', 'all'
    const jobId = searchParams.get('jobId');

    // Get all job postings for this employer
    const jobPostings = await prisma.jobPosting.findMany({
      where: { userId: user.id },
      select: { id: true, jobTitle: true, companyName: true, status: true },
    });

    const jobPostingIds = jobPostings.map(j => j.id);

    if (jobPostingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          invitations: [],
          stats: { total: 0, pending: 0, viewed: 0, completed: 0, expired: 0 },
          jobPostings: [],
        },
      });
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      jobPostingId: jobId ? jobId : { in: jobPostingIds },
    };

    // Get all invitations with job posting info
    const invitations = await prisma.candidateInvitation.findMany({
      where: whereClause,
      include: {
        jobPosting: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            status: true,
          },
        },
        screeningResponses: true,
      },
      orderBy: { sentAt: 'desc' },
    });

    const typedInvitations = invitations as unknown as InvitationWithJob[];

    // Calculate stats
    const now = new Date();
    const stats = {
      total: typedInvitations.length,
      pending: typedInvitations.filter(i => 
        (i.status === 'PENDING' || i.status === 'VIEWED') && 
        now <= new Date(i.expiresAt)
      ).length,
      viewed: typedInvitations.filter(i => i.status === 'VIEWED').length,
      completed: typedInvitations.filter(i => i.status === 'COMPLETED').length,
      expired: typedInvitations.filter(i => 
        now > new Date(i.expiresAt) && 
        i.status !== 'COMPLETED'
      ).length,
    };

    // Apply status filter
    let filteredInvitations = typedInvitations;
    if (statusFilter && statusFilter !== 'all') {
      filteredInvitations = typedInvitations.filter(inv => {
        const isExpired = now > new Date(inv.expiresAt);
        
        switch (statusFilter) {
          case 'pending':
            return (inv.status === 'PENDING' || inv.status === 'VIEWED') && !isExpired;
          case 'completed':
            return inv.status === 'COMPLETED';
          case 'expired':
            return isExpired && inv.status !== 'COMPLETED';
          default:
            return true;
        }
      });
    }

    // Map to response format
    const invitationsData = filteredInvitations.map(inv => ({
      id: inv.id,
      token: inv.token,
      candidateId: inv.candidateId,
      candidateEmail: inv.candidateEmail,
      candidateName: inv.candidateName,
      status: inv.status,
      message: inv.message,
      sentAt: inv.sentAt,
      viewedAt: inv.viewedAt,
      respondedAt: inv.respondedAt,
      expiresAt: inv.expiresAt,
      responsesCount: inv.screeningResponses.length,
      isExpired: now > new Date(inv.expiresAt),
      isCompleted: inv.status === 'COMPLETED',
      jobPosting: inv.jobPosting,
    }));

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitationsData,
        stats,
        jobPostings: jobPostings.map(j => ({ id: j.id, title: j.jobTitle })),
      },
    });
  } catch (error) {
    console.error('Error fetching employer invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
