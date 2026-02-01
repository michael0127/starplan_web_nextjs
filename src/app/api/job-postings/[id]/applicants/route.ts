/**
 * Job Applicants API
 * GET /api/job-postings/[id]/applicants
 * Returns all candidates who matched with this job posting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const passedHardGate = searchParams.get('passedHardGate');
    const skip = (page - 1) * limit;

    // Verify the job posting belongs to the user
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: jobPostingId,
        userId: user.id,
      },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        categorySkills: true,
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found or access denied' },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      jobPostingId,
      isActive: true,
    };

    if (passedHardGate === 'true') {
      whereClause.passedHardGate = true;
    } else if (passedHardGate === 'false') {
      whereClause.passedHardGate = false;
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    // Get total count
    const totalCount = await prisma.candidateJobMatch.count({
      where: whereClause,
    });

    // Fetch applicants with candidate details
    const applicants = await prisma.candidateJobMatch.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            categories: true,
            categorySkills: true,
            experienceLevel: true,
            experienceYearsFrom: true,
            experienceYearsTo: true,
            workAuthCountries: true,
            workTypes: true,
            profile: true,
          },
        },
        cv: {
          select: {
            id: true,
            fileUrl: true,
            extractedData: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Calculate statistics
    const stats = await prisma.candidateJobMatch.groupBy({
      by: ['passedHardGate'],
      where: {
        jobPostingId,
        isActive: true,
      },
      _count: true,
    });

    const passedCount = stats.find(s => s.passedHardGate)?._count || 0;
    const failedCount = stats.find(s => !s.passedHardGate)?._count || 0;

    // Format response
    const formattedApplicants = applicants.map(applicant => {
      const cvData = applicant.cv?.extractedData as Record<string, unknown> | null;
      const matchDetails = applicant.matchDetails as Record<string, unknown> | null;
      const profile = applicant.candidate.profile as Record<string, unknown> | null;
      
      // Extract cv_data from profile if exists
      const profileCvData = profile?.cv_data as Record<string, unknown> | null;
      
      // Extract work experience from profile (prefer profile.work_experience or profile.cv_data.work_experience)
      const workExperience = (
        profile?.work_experience || 
        profileCvData?.work_experience || 
        cvData?.work_experience ||
        []
      ) as Array<{
        company_name?: string;
        job_title?: string;
        start_date?: string;
        end_date?: string;
        is_current?: boolean;
        location?: string;
      }>;
      
      // Extract education from profile (prefer profile.education or profile.cv_data.education)
      const education = (
        profile?.education || 
        profileCvData?.education || 
        cvData?.education ||
        []
      ) as Array<{
        institution_name?: string;
        degree?: string;
        major?: string;
        start_date?: string;
        end_date?: string;
        is_current?: boolean;
      }>;
      
      // Extract skills from profile (prefer profile.skills or profile.cv_data.skills)
      const profileSkills = profile?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
      const cvDataSkills = profileCvData?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
      
      // Combine technical and soft skills
      const technicalSkills = profileSkills?.technical_skills || cvDataSkills?.technical_skills || [];
      const softSkills = profileSkills?.soft_skills || cvDataSkills?.soft_skills || [];
      const allProfileSkills = [...technicalSkills, ...softSkills];
      
      // Use profile skills first, then categorySkills as fallback
      const candidateSkills = allProfileSkills.length > 0 
        ? allProfileSkills 
        : (applicant.candidate.categorySkills || []);
      
      // Extract personal info for headline and location
      const personalInfo = (profile?.personal || profileCvData?.personal) as {
        full_name?: string;
        location?: string;
        linkedin_url?: string;
      } | null;
      
      // Calculate skills match
      const jobSkills = jobPosting.categorySkills || [];
      const matchedSkills = Array.isArray(candidateSkills) 
        ? candidateSkills.filter((skill: string) => 
            jobSkills.some((jobSkill: string) => 
              jobSkill.toLowerCase() === skill.toLowerCase()
            )
          )
        : [];

      // Format experience for display
      const formattedExperience = Array.isArray(workExperience) 
        ? workExperience.slice(0, 3).map(exp => ({
            title: exp.job_title || '',
            company: exp.company_name || '',
            startDate: exp.start_date || '',
            endDate: exp.end_date || '',
            current: exp.is_current || false,
            location: exp.location || '',
          }))
        : [];

      // Format education for display
      const formattedEducation = Array.isArray(education)
        ? education.slice(0, 3).map(edu => ({
            school: edu.institution_name || '',
            degree: edu.degree || '',
            field: edu.major || '',
            startYear: edu.start_date || '',
            endYear: edu.end_date || '',
            current: edu.is_current || false,
          }))
        : [];

      return {
        id: applicant.id,
        candidateId: applicant.candidateId,
        appliedAt: applicant.createdAt,
        passedHardGate: applicant.passedHardGate,
        hardGateReasons: applicant.hardGateReasons,
        matchDetails,
        employerViewed: applicant.employerViewed,
        employerInterested: applicant.employerInterested,
        candidateInterested: applicant.candidateInterested,
        candidate: {
          id: applicant.candidate.id,
          name: applicant.candidate.name || personalInfo?.full_name || 'Anonymous',
          email: applicant.candidate.email,
          avatarUrl: applicant.candidate.avatarUrl,
          headline: (profile?.headline || applicant.candidate.categories?.join(' | ') || '') as string,
          location: (personalInfo?.location || applicant.candidate.workAuthCountries?.[0] || 'Unknown') as string,
          experienceLevel: applicant.candidate.experienceLevel,
          experienceYears: applicant.candidate.experienceYearsFrom,
        },
        experience: formattedExperience,
        education: formattedEducation,
        skills: Array.isArray(candidateSkills) ? candidateSkills : [],
        skillsMatch: {
          matched: matchedSkills,
          total: jobSkills.length,
          percentage: jobSkills.length > 0 
            ? Math.round((matchedSkills.length / jobSkills.length) * 100)
            : 0,
        },
        hasResume: !!applicant.cv,
        resumeUrl: applicant.cv?.fileUrl,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        jobPosting: {
          id: jobPosting.id,
          title: jobPosting.jobTitle,
          companyName: jobPosting.companyName,
        },
        applicants: formattedApplicants,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          total: totalCount,
          passed: passedCount,
          failed: failedCount,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching applicants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}

// PATCH /api/job-postings/[id]/applicants - Update applicant status (employer viewed, interested)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const body = await request.json();
    const { applicantId, action } = body;

    // Verify job posting ownership
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: jobPostingId,
        userId: user.id,
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found or access denied' },
        { status: 404 }
      );
    }

    // Handle remove action - delete the applicant from the system
    if (action === 'remove') {
      await prisma.candidateJobMatch.delete({
        where: { id: applicantId },
      });

      return NextResponse.json({
        success: true,
        removed: true,
      });
    }

    // Update applicant status
    const updateData: Record<string, boolean> = {};
    
    if (action === 'view') {
      updateData.employerViewed = true;
    } else if (action === 'interested') {
      updateData.employerInterested = true;
      updateData.employerViewed = true;
    } else if (action === 'reject') {
      // reject now just removes from pipeline (toggle off)
      updateData.employerInterested = false;
      updateData.employerViewed = true;
    }

    const updated = await prisma.candidateJobMatch.update({
      where: { id: applicantId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error) {
    console.error('Error updating applicant:', error);
    return NextResponse.json(
      { error: 'Failed to update applicant' },
      { status: 500 }
    );
  }
}

