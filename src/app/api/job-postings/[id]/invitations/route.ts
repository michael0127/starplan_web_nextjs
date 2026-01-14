import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { SYSTEM_SCREENING_QUESTIONS } from '@/lib/screeningOptions';

// Supabase Admin client for checking email verification and sending verification emails
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface InvitationRecord {
  id: string;
  token: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string | null;
  status: string;
}

interface InvitationWithResponses extends InvitationRecord {
  message: string | null;
  sentAt: Date;
  viewedAt: Date | null;
  respondedAt: Date | null;
  expiresAt: Date;
  screeningResponses: unknown[];
}

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

    // Get candidate details (including profile for fallback name)
    const candidates = await prisma.user.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, email: true, name: true, profile: true },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates found' }, { status: 400 });
    }

    // Helper function to get candidate name (fallback to profile if name is null)
    const getCandidateName = (candidate: { name: string | null; profile: unknown }): string | null => {
      if (candidate.name) return candidate.name;
      
      // Try to get name from profile JSON
      if (candidate.profile && typeof candidate.profile === 'object') {
        const profile = candidate.profile as Record<string, unknown>;
        const personal = profile.personal as Record<string, unknown> | undefined;
        if (personal?.full_name && typeof personal.full_name === 'string') {
          return personal.full_name;
        }
      }
      return null;
    };

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
          // Also update candidate name in case it was missing before
          return prisma.candidateInvitation.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              message,
              expiresAt,
              sentAt: new Date(),
              viewedAt: null,
              respondedAt: null,
              candidateName: getCandidateName(candidate) || existing.candidateName,
            },
          });
        } else {
          // Create new invitation
          return prisma.candidateInvitation.create({
            data: {
              jobPostingId,
              candidateId: candidate.id,
              candidateEmail: candidate.email,
              candidateName: getCandidateName(candidate),
              message,
              expiresAt,
            },
          });
        }
      })
    );

    // Get base URL for invitation links
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Check email verification status and send verification if needed
    // Note: Currently invites one candidate at a time, but loop kept for future batch support
    let unverifiedCount = 0;
    let verificationsSent = 0;

    for (const candidate of candidates) {
      try {
        // Get user from Supabase Auth to check email verification status
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(candidate.id);
        
        if (authUserError || !authUser?.user) {
          console.log(`Could not get auth user for ${candidate.email}:`, authUserError?.message);
          continue;
        }

        // Check if email is not confirmed (email_confirmed_at is null)
        const isEmailVerified = !!authUser.user.email_confirmed_at;
        
        if (!isEmailVerified) {
          unverifiedCount++;
          
          // Send verification email using Supabase resend
          // Redirect to auth/confirm which handles the verification flow
          const { error: resendError } = await supabaseAdmin.auth.resend({
            type: 'signup',
            email: candidate.email,
            options: {
              emailRedirectTo: `${baseUrl}/auth/confirm`,
            },
          });

          if (resendError) {
            console.error(`Failed to send verification email to ${candidate.email}:`, resendError.message);
          } else {
            verificationsSent++;
            console.log(`Verification email sent to unverified user: ${candidate.email}`);
          }
        }
      } catch (err) {
        console.error(`Error checking verification for ${candidate.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitations.map((inv: InvitationRecord) => ({
          id: inv.id,
          token: inv.token,
          candidateId: inv.candidateId,
          candidateEmail: inv.candidateEmail,
          candidateName: inv.candidateName,
          status: inv.status,
          inviteLink: `${baseUrl}/invite/${inv.token}`,
        })),
        totalSent: invitations.length,
        questionsCount: {
          system: jobPosting.systemScreeningAnswers.length,
          custom: jobPosting.customScreeningQuestions.length,
        },
        // Email verification info
        emailVerification: {
          unverifiedCount,
          verificationsSent,
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
    const typedInvitations = invitations as unknown as InvitationWithResponses[];
    const invitationsWithSummary = typedInvitations.map((inv: InvitationWithResponses) => ({
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
          total: typedInvitations.length,
          pending: typedInvitations.filter((i: InvitationWithResponses) => i.status === 'PENDING').length,
          viewed: typedInvitations.filter((i: InvitationWithResponses) => i.status === 'VIEWED').length,
          completed: typedInvitations.filter((i: InvitationWithResponses) => i.status === 'COMPLETED').length,
          expired: typedInvitations.filter((i: InvitationWithResponses) => new Date() > i.expiresAt && i.status !== 'COMPLETED').length,
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
