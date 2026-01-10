import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { SYSTEM_SCREENING_QUESTIONS } from '@/lib/screeningOptions';

// POST /api/job-postings/[id]/invitations - Send invitations to candidates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobPostingId } = await params;
    const body = await request.json();
    const { candidateIds, message } = body as {
      candidateIds: string[];
      message?: string;
    };

    if (!candidateIds || candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one candidate must be selected' },
        { status: 400 }
      );
    }

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

    // Verify job posting belongs to user and get screening questions
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, userId: user.id },
      include: {
        systemScreeningAnswers: true,
        customScreeningQuestions: true,
      },
    });

    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    // Check if there are any screening questions
    const hasQuestions = 
      jobPosting.systemScreeningAnswers.length > 0 || 
      jobPosting.customScreeningQuestions.length > 0;

    if (!hasQuestions) {
      return NextResponse.json(
        { error: 'No screening questions configured for this job posting' },
        { status: 400 }
      );
    }

    // Get candidate details
    const candidates = await prisma.user.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, email: true, name: true },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates found' }, { status: 400 });
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitations (upsert to handle existing invitations)
    const invitations = await Promise.all(
      candidates.map(async (candidate) => {
        // Check for existing invitation
        const existing = await prisma.candidateInvitation.findUnique({
          where: {
            jobPostingId_candidateId: {
              jobPostingId,
              candidateId: candidate.id,
            },
          },
        });

        if (existing) {
          // Update existing invitation - reset status and extend expiry
          return prisma.candidateInvitation.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              message,
              expiresAt,
              sentAt: new Date(),
              viewedAt: null,
              respondedAt: null,
            },
          });
        } else {
          // Create new invitation
          return prisma.candidateInvitation.create({
            data: {
              jobPostingId,
              candidateId: candidate.id,
              candidateEmail: candidate.email,
              candidateName: candidate.name,
              message,
              expiresAt,
            },
          });
        }
      })
    );

    // TODO: Send invitation emails to candidates
    // For now, just return the invitation links

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          token: inv.token,
          candidateId: inv.candidateId,
          candidateEmail: inv.candidateEmail,
          candidateName: inv.candidateName,
          status: inv.status,
          inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/invite/${inv.token}`,
        })),
        totalSent: invitations.length,
        questionsCount: {
          system: jobPosting.systemScreeningAnswers.length,
          custom: jobPosting.customScreeningQuestions.length,
        },
      },
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/job-postings/[id]/invitations - Get all invitations for a job posting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobPostingId } = await params;

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

    // Verify job posting belongs to user
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, userId: user.id },
    });

    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    // Get all invitations with responses
    const invitations = await prisma.candidateInvitation.findMany({
      where: { jobPostingId },
      include: {
        screeningResponses: true,
      },
      orderBy: { sentAt: 'desc' },
    });

    // Map to include response summary
    const invitationsWithSummary = invitations.map((inv) => ({
      id: inv.id,
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
      isExpired: new Date() > inv.expiresAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitationsWithSummary,
        stats: {
          total: invitations.length,
          pending: invitations.filter((i) => i.status === 'PENDING').length,
          viewed: invitations.filter((i) => i.status === 'VIEWED').length,
          completed: invitations.filter((i) => i.status === 'COMPLETED').length,
          expired: invitations.filter((i) => new Date() > i.expiresAt && i.status !== 'COMPLETED').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
