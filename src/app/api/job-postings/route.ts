import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import type { JobPostingFormData } from '@/types/jobPosting';

// POST /api/job-postings - Create or update a job posting
export async function POST(request: NextRequest) {
  try {
    const body: JobPostingFormData & { id?: string; status?: string } = await request.json();

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

    const userId = user.id;

    // Validate required fields based on status
    const isDraft = body.status === 'DRAFT';
    
    if (!body.jobTitle || !body.jobTitle.trim()) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      );
    }
    
    if (!isDraft) {
      // For published jobs, validate all required fields
      if (!body.companyName || !body.companyName.trim()) {
        return NextResponse.json(
          { error: 'Company name is required for publishing' },
          { status: 400 }
        );
      }
      if (!body.jobDescription || !body.jobDescription.trim()) {
        return NextResponse.json(
          { error: 'Job description is required for publishing' },
          { status: 400 }
        );
      }
      if (!body.jobSummary || !body.jobSummary.trim()) {
        return NextResponse.json(
          { error: 'Job summary is required for publishing' },
          { status: 400 }
        );
      }
    }
    
    // Prepare the data for Prisma
    const jobPostingData = {
      userId,
      status: (body.status as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') || 'DRAFT',
      
      // Step 1: Job Classification
      jobTitle: body.jobTitle,
      categories: body.categories || [],
      categorySkills: body.categorySkills || [],
      isCategoryManuallySelected: body.isCategoryManuallySelected || false,
      countryRegion: body.countryRegion || 'Australia',
      experienceLevel: body.experienceLevel || 'Junior',
      experienceYearsFrom: body.experienceYearsFrom || 0,
      experienceYearsTo: body.experienceYearsTo?.toString() || '0',
      workType: body.workType || 'Full-time',
      payType: body.payType || 'Annual salary',
      currency: body.currency || 'AUD',
      payFrom: body.payFrom || '',
      payTo: body.payTo || '',
      showSalaryOnAd: body.showSalaryOnAd ?? true,
      salaryDisplayText: body.salaryDisplayText || null,
      
      // Step 2: Job Details (allow empty for drafts)
      companyName: body.companyName || '',
      jobDescription: body.jobDescription || '',
      jobSummary: body.jobSummary || '',
      keySellingPoint1: body.keySellingPoint1 || null,
      keySellingPoint2: body.keySellingPoint2 || null,
      keySellingPoint3: body.keySellingPoint3 || null,
      companyLogo: body.companyLogo || null,
      companyCoverImage: body.companyCoverImage || null,
      videoLink: body.videoLink || null,
      
      // Step 3: Screening & Filters
      selectedCountries: body.selectedCountries || [],
      workAuthByCountry: body.workAuthByCountry || {},
      applicationDeadline: body.applicationDeadline 
        ? new Date(body.applicationDeadline) 
        : null,
    };

    let jobPosting;

    if (body.id) {
      // Update existing job posting
      jobPosting = await prisma.jobPosting.update({
        where: { id: body.id },
        data: {
          ...jobPostingData,
          // Delete existing screening answers and questions, then recreate
          systemScreeningAnswers: {
            deleteMany: {},
            create: (body.systemScreeningAnswers || []).map(answer => ({
              questionId: answer.questionId,
              requirement: answer.requirement,
              selectedAnswers: answer.selectedAnswers,
            })),
          },
          customScreeningQuestions: {
            deleteMany: {},
            create: (body.customScreeningQuestions || []).map(question => ({
              questionText: question.questionText,
              answerType: question.answerType,
              options: question.options || [],
              mustAnswer: question.mustAnswer,
              idealAnswer: question.idealAnswer ? question.idealAnswer : undefined,
              disqualifyIfNotIdeal: question.disqualifyIfNotIdeal,
            })),
          },
        },
        include: {
          systemScreeningAnswers: true,
          customScreeningQuestions: true,
        },
      });
    } else {
      // Create new job posting
      jobPosting = await prisma.jobPosting.create({
        data: {
          ...jobPostingData,
          systemScreeningAnswers: {
            create: (body.systemScreeningAnswers || []).map(answer => ({
              questionId: answer.questionId,
              requirement: answer.requirement,
              selectedAnswers: answer.selectedAnswers,
            })),
          },
          customScreeningQuestions: {
            create: (body.customScreeningQuestions || []).map(question => ({
              questionText: question.questionText,
              answerType: question.answerType,
              options: question.options || [],
              mustAnswer: question.mustAnswer,
              idealAnswer: question.idealAnswer ? question.idealAnswer : undefined,
              disqualifyIfNotIdeal: question.disqualifyIfNotIdeal,
            })),
          },
        },
        include: {
          systemScreeningAnswers: true,
          customScreeningQuestions: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: jobPosting,
    });

  } catch (error) {
    console.error('Error saving job posting:', error);
    return NextResponse.json(
      { error: 'Failed to save job posting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/job-postings - Get all job postings for the authenticated user
export async function GET(request: NextRequest) {
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

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        userId,
        ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' }),
      },
      include: {
        systemScreeningAnswers: true,
        customScreeningQuestions: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: jobPostings,
    });

  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}

