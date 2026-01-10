import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SYSTEM_SCREENING_QUESTIONS } from '@/lib/screeningOptions';

// GET /api/invitations/[token] - Get invitation details for candidate (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.candidateInvitation.findUnique({
      where: { token },
      include: {
        jobPosting: {
          include: {
            systemScreeningAnswers: true,
            customScreeningQuestions: true,
          },
        },
        screeningResponses: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation has expired
    const isExpired = new Date() > invitation.expiresAt;
    if (isExpired && invitation.status !== 'COMPLETED') {
      // Update status to expired if not already completed
      await prisma.candidateInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({
        success: false,
        error: 'This invitation has expired',
        data: { status: 'EXPIRED', expiresAt: invitation.expiresAt },
      }, { status: 410 });
    }

    // Update to VIEWED status if first time viewing
    if (invitation.status === 'PENDING') {
      await prisma.candidateInvitation.update({
        where: { id: invitation.id },
        data: { status: 'VIEWED', viewedAt: new Date() },
      });
    }

    // Build questions list from job posting
    const systemQuestions = invitation.jobPosting.systemScreeningAnswers.map((answer) => {
      // Find the question definition
      const questionDef = SYSTEM_SCREENING_QUESTIONS.find((q) => q.id === answer.questionId);
      return {
        type: 'system' as const,
        questionId: answer.questionId,
        questionText: questionDef?.question || answer.questionId,
        answerType: questionDef?.type || 'multiple',
        options: questionDef?.options || [],
        requirement: answer.requirement,
        expectedAnswers: answer.selectedAnswers,
      };
    });

    const customQuestions = invitation.jobPosting.customScreeningQuestions.map((q) => ({
      type: 'custom' as const,
      questionId: q.id,
      questionText: q.questionText,
      answerType: q.answerType,
      options: q.options,
      mustAnswer: q.mustAnswer,
      requirement: q.requirement,
    }));

    // Get existing responses
    const existingResponses = invitation.screeningResponses.reduce((acc, resp) => {
      acc[`${resp.questionType}_${resp.questionId}`] = resp.answer;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          status: invitation.status,
          candidateName: invitation.candidateName,
          candidateEmail: invitation.candidateEmail,
          message: invitation.message,
          expiresAt: invitation.expiresAt,
          isCompleted: invitation.status === 'COMPLETED',
        },
        jobPosting: {
          id: invitation.jobPosting.id,
          jobTitle: invitation.jobPosting.jobTitle,
          companyName: invitation.jobPosting.companyName,
          companyLogo: invitation.jobPosting.companyLogo,
          countryRegion: invitation.jobPosting.countryRegion,
          workType: invitation.jobPosting.workType,
        },
        questions: {
          system: systemQuestions,
          custom: customQuestions,
          total: systemQuestions.length + customQuestions.length,
        },
        existingResponses,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

// POST /api/invitations/[token] - Submit screening responses
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { responses } = body as {
      responses: Array<{
        questionType: 'system' | 'custom';
        questionId: string;
        questionText: string;
        answerType: string;
        answer: string | string[] | boolean;
      }>;
    };

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'At least one response is required' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.candidateInvitation.findUnique({
      where: { token },
      include: {
        jobPosting: {
          include: {
            systemScreeningAnswers: true,
            customScreeningQuestions: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check if already completed (can still update)
    // Allow re-submission within expiry period

    // Delete existing responses and create new ones (upsert approach)
    await prisma.candidateScreeningResponse.deleteMany({
      where: { invitationId: invitation.id },
    });

    // Create all responses
    const createdResponses = await prisma.candidateScreeningResponse.createMany({
      data: responses.map((resp) => ({
        invitationId: invitation.id,
        questionType: resp.questionType,
        questionId: resp.questionId,
        questionText: resp.questionText,
        answerType: resp.answerType,
        answer: resp.answer as object,
      })),
    });

    // Update invitation status to COMPLETED
    await prisma.candidateInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'COMPLETED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        responsesCount: createdResponses.count,
        status: 'COMPLETED',
        respondedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error submitting responses:', error);
    return NextResponse.json(
      { error: 'Failed to submit responses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
