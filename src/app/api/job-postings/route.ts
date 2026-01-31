import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import type { JobPostingFormData } from '@/types/jobPosting';
import { getUserCompanyContext } from '@/lib/company-access';

// 配置 route segment config - 启用缓存
export const dynamic = 'force-dynamic'; // GET 需要动态数据
export const revalidate = 30; // 30 秒后重新验证缓存

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

    // Fetch company settings to get default logo, cover, video, and description
    const companySettings = await prisma.company.findUnique({
      where: { userId },
      select: {
        companyName: true,
        companyLogo: true,
        companyCoverImage: true,
        videoLink: true,
        description: true,
      },
    });

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
          { error: 'Company summary is required for publishing' },
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
      // Use company settings as defaults for company name, logo, cover, video, and description
      companyName: body.companyName || companySettings?.companyName || '',
      jobDescription: body.jobDescription || '',
      // Use company description as default for jobSummary (Company Summary)
      jobSummary: body.jobSummary || companySettings?.description || '',
      keySellingPoint1: body.keySellingPoint1 || null,
      keySellingPoint2: body.keySellingPoint2 || null,
      keySellingPoint3: body.keySellingPoint3 || null,
      companyLogo: body.companyLogo || companySettings?.companyLogo || null,
      companyCoverImage: body.companyCoverImage || companySettings?.companyCoverImage || null,
      videoLink: body.videoLink || companySettings?.videoLink || null,
      
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
              requirement: question.requirement || 'accept-any',
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
              requirement: question.requirement || 'accept-any',
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

    // Get company context for team data sharing
    const companyContext = await getUserCompanyContext(userId);
    
    // Use company user IDs if available, otherwise fall back to current user only
    const userIdsFilter = companyContext?.userIds || [userId];

    console.log('[API] Fetching job postings for company team, users:', userIdsFilter.length, 'status:', status || 'all');
    const startTime = Date.now();

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        userId: { in: userIdsFilter },
        ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' }),
      },
      include: {
        systemScreeningAnswers: {
          take: 50, // 限制每个 job 最多返回 50 个 screening answers
        },
        customScreeningQuestions: {
          take: 20, // 限制每个 job 最多返回 20 个自定义问题
        },
        _count: {
          select: {
            candidateMatches: true, // Count of applicants
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100, // 限制返回最多 100 个 job postings
    });

    // Transform job postings to include applicant count
    const jobPostingsWithStats = jobPostings.map(job => ({
      ...job,
      applicantCount: job._count?.candidateMatches || 0,
    }));

    const duration = Date.now() - startTime;
    console.log(`[API] Fetched ${jobPostings.length} job postings in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        data: jobPostingsWithStats,
      },
      {
        headers: {
          // 添加 Cache-Control 头，允许浏览器缓存 30 秒
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}

