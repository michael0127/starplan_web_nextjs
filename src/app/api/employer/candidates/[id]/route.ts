import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { getUserCompanyContext } from '@/lib/company-access';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is an employer
    const employer = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { userType: true }
    });

    if (employer?.userType !== 'EMPLOYER') {
      return NextResponse.json(
        { error: 'Employer access required' },
        { status: 403 }
      );
    }

    // Get company context for team data sharing
    const companyContext = await getUserCompanyContext(authUser.id);
    
    // Use company user IDs if available, otherwise fall back to current user only
    const userIdsFilter = companyContext?.userIds || [authUser.id];

    // Get candidate with their CV and profile
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        cvs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        candidateMatches: {
          include: {
            jobPosting: {
              select: {
                id: true,
                jobTitle: true,
                companyName: true,
                userId: true,
              }
            }
          },
          where: {
            jobPosting: {
              userId: { in: userIdsFilter }
            }
          }
        }
      }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Parse profile data
    const profile = candidate.profile as Record<string, unknown> | null;
    const cvData = profile?.cv_data as Record<string, unknown> | null;
    const cv = candidate.cvs[0];
    const extractedData = cv?.extractedData as Record<string, unknown> | null;

    // Extract work experience
    const workExperience = (
      profile?.work_experience || 
      cvData?.work_experience || 
      extractedData?.work_experience ||
      []
    ) as Array<{
      company_name?: string;
      job_title?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
      location?: string;
      description?: string;
    }>;

    // Extract education
    const education = (
      profile?.education || 
      cvData?.education || 
      extractedData?.education ||
      []
    ) as Array<{
      institution_name?: string;
      degree?: string;
      major?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
    }>;

    // Extract skills
    const profileSkills = profile?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
    const cvDataSkills = cvData?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
    const extractedSkills = extractedData?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
    
    const technicalSkills = profileSkills?.technical_skills || cvDataSkills?.technical_skills || extractedSkills?.technical_skills || [];
    const softSkills = profileSkills?.soft_skills || cvDataSkills?.soft_skills || extractedSkills?.soft_skills || [];

    // Extract personal info
    const personal = (
      cvData?.personal || 
      extractedData?.personal ||
      {}
    ) as {
      full_name?: string;
      first_name?: string;
      last_name?: string;
      personal_email?: string;
      phone_number?: string;
      linkedin_url?: string;
      github_url?: string;
      location?: string;
    };

    // Get application info if exists
    const application = candidate.candidateMatches[0];

    return NextResponse.json({
      success: true,
      data: {
        id: candidate.id,
        name: candidate.name || personal.full_name || `${personal.first_name || ''} ${personal.last_name || ''}`.trim() || 'Unknown',
        email: candidate.email,
        avatarUrl: candidate.avatarUrl,
        headline: (profile?.headline as string) || null,
        bio: (profile?.bio as string) || null,
        location: candidate.preferredLocation || personal.location || null,
        experienceLevel: candidate.experienceLevel,
        experienceYears: candidate.experienceYearsFrom,
        personal: {
          phone: personal.phone_number,
          email: personal.personal_email || candidate.email,
          linkedin: personal.linkedin_url || (profile?.social as Record<string, string>)?.linkedin,
          github: personal.github_url || (profile?.social as Record<string, string>)?.github,
        },
        workExperience: workExperience.map(exp => ({
          title: exp.job_title,
          company: exp.company_name,
          location: exp.location,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          description: exp.description,
        })),
        education: education.map(edu => ({
          school: edu.institution_name,
          degree: edu.degree,
          field: edu.major,
          startDate: edu.start_date,
          endDate: edu.end_date,
          isCurrent: edu.is_current,
        })),
        skills: {
          technical: technicalSkills,
          soft: softSkills,
        },
        cv: cv ? {
          id: cv.id,
          fileUrl: cv.fileUrl,
          uploadedAt: cv.createdAt,
        } : null,
        application: application ? {
          id: application.id,
          jobTitle: application.jobPosting.jobTitle,
          companyName: application.jobPosting.companyName,
          appliedAt: application.createdAt,
          passedHardGate: application.passedHardGate,
        } : null,
      }
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate details' },
      { status: 500 }
    );
  }
}
