import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { SYSTEM_SCREENING_QUESTIONS } from '@/lib/screeningOptions';

// GET /api/job-postings/[id]/invitations/[invitationId] - Get detailed invitation with responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id: jobPostingId, invitationId } = await params;

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
      include: {
        systemScreeningAnswers: true,
        customScreeningQuestions: true,
      },
    });

    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    // Get invitation with responses
    const invitation = await prisma.candidateInvitation.findFirst({
      where: { id: invitationId, jobPostingId },
      include: {
        screeningResponses: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Build expected questions with candidate responses
    const systemQuestionsWithResponses = jobPosting.systemScreeningAnswers.map((answer) => {
      const questionDef = SYSTEM_SCREENING_QUESTIONS.find((q) => q.id === answer.questionId);
      const candidateResponse = invitation.screeningResponses.find(
        (r) => r.questionType === 'system' && r.questionId === answer.questionId
      );

      return {
        type: 'system',
        questionId: answer.questionId,
        questionText: questionDef?.question || answer.questionId,
        answerType: questionDef?.type || 'multiple',
        options: questionDef?.options || [],
        requirement: answer.requirement,
        expectedAnswers: answer.selectedAnswers,
        candidateAnswer: candidateResponse?.answer || null,
        hasResponse: !!candidateResponse,
        // Check if candidate's answer matches expected
        matchesExpected: candidateResponse
          ? checkAnswerMatch(answer.selectedAnswers, candidateResponse.answer)
          : null,
      };
    });

    const customQuestionsWithResponses = jobPosting.customScreeningQuestions.map((q) => {
      const candidateResponse = invitation.screeningResponses.find(
        (r) => r.questionType === 'custom' && r.questionId === q.id
      );

      return {
        type: 'custom',
        questionId: q.id,
        questionText: q.questionText,
        answerType: q.answerType,
        options: q.options,
        mustAnswer: q.mustAnswer,
        requirement: q.requirement,
        idealAnswer: q.idealAnswer,
        disqualifyIfNotIdeal: q.disqualifyIfNotIdeal,
        candidateAnswer: candidateResponse?.answer || null,
        hasResponse: !!candidateResponse,
        // Check if candidate's answer matches ideal
        matchesIdeal: candidateResponse && q.idealAnswer
          ? checkIdealAnswerMatch(q.idealAnswer, candidateResponse.answer, q.answerType)
          : null,
      };
    });

    // Calculate overall match score
    const totalQuestions = systemQuestionsWithResponses.length + customQuestionsWithResponses.length;
    const matchedQuestions = [
      ...systemQuestionsWithResponses.filter((q) => q.matchesExpected === true),
      ...customQuestionsWithResponses.filter((q) => q.matchesIdeal === true),
    ].length;

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          candidateId: invitation.candidateId,
          candidateEmail: invitation.candidateEmail,
          candidateName: invitation.candidateName,
          status: invitation.status,
          message: invitation.message,
          sentAt: invitation.sentAt,
          viewedAt: invitation.viewedAt,
          respondedAt: invitation.respondedAt,
          expiresAt: invitation.expiresAt,
        },
        questions: {
          system: systemQuestionsWithResponses,
          custom: customQuestionsWithResponses,
        },
        summary: {
          totalQuestions,
          answeredQuestions: invitation.screeningResponses.length,
          matchedQuestions,
          matchPercentage: totalQuestions > 0 
            ? Math.round((matchedQuestions / totalQuestions) * 100) 
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}

// Helper function to check if candidate's answer matches expected answers
function checkAnswerMatch(expected: string[], candidateAnswer: unknown): boolean {
  if (!candidateAnswer) return false;
  
  // Convert candidate answer to array for comparison
  const candidateAnswers = Array.isArray(candidateAnswer) 
    ? candidateAnswer 
    : [candidateAnswer];
  
  // Check if at least one expected answer is in candidate's answers
  return expected.some((exp) => candidateAnswers.includes(exp));
}

// Helper function to check if candidate's answer matches ideal answer
function checkIdealAnswerMatch(
  idealAnswer: unknown,
  candidateAnswer: unknown,
  answerType: string
): boolean {
  if (!candidateAnswer || !idealAnswer) return false;

  switch (answerType) {
    case 'yes-no':
      return idealAnswer === candidateAnswer;
    case 'single':
      return idealAnswer === candidateAnswer;
    case 'multiple':
      const idealArr = Array.isArray(idealAnswer) ? idealAnswer : [idealAnswer];
      const candidateArr = Array.isArray(candidateAnswer) ? candidateAnswer : [candidateAnswer];
      // Check if candidate's answers include all ideal answers
      return idealArr.every((ia) => candidateArr.includes(ia));
    case 'short-text':
      // For text answers, just check if not empty (ideal is usually just "answered")
      return typeof candidateAnswer === 'string' && candidateAnswer.trim().length > 0;
    default:
      return false;
  }
}
