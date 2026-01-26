/**
 * Employer Applicants API
 * GET /api/employer/applicants
 * Returns all candidates who matched with any job posting of this employer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Structured location type (new format from CV extraction)
interface StructuredLocation {
  country: string | null;
  state: string | null;
  city: string | null;
}

// Hierarchical location for filter options
interface LocationHierarchy {
  countries: Array<{
    name: string;
    count: number;
    states: Array<{
      name: string;
      count: number;
      cities: Array<{
        name: string;
        count: number;
      }>;
    }>;
  }>;
}

// Parse location from profile - supports both old (string) and new (object) formats
function parseLocation(locationData: unknown): StructuredLocation | null {
  if (!locationData) return null;
  
  // New format: structured object
  if (typeof locationData === 'object' && locationData !== null) {
    const loc = locationData as Record<string, unknown>;
    return {
      country: (loc.country as string) || null,
      state: (loc.state as string) || null,
      city: (loc.city as string) || null,
    };
  }
  
  // Old format: string - try to parse common patterns
  if (typeof locationData === 'string') {
    const str = locationData.trim();
    if (!str) return null;
    
    // Try to parse patterns like "City, State, Country" or "City, Country"
    const parts = str.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    
    if (parts.length >= 3) {
      // Assume: City, State, Country
      return { city: parts[0], state: parts[1], country: parts[2] };
    } else if (parts.length === 2) {
      // Assume: City, Country (no state)
      return { city: parts[0], state: null, country: parts[1] };
    } else if (parts.length === 1) {
      // Could be just a country or city - treat as country for filtering
      return { city: null, state: null, country: parts[0] };
    }
  }
  
  return null;
}

// Get display string for location (for backward compatibility)
function getLocationDisplayString(loc: StructuredLocation | null): string {
  if (!loc) return 'Unknown';
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

// Build hierarchical location structure for filter options
function buildLocationHierarchy(
  applicants: Array<{ location: StructuredLocation | null }>
): LocationHierarchy {
  const countryMap = new Map<string, {
    count: number;
    states: Map<string, {
      count: number;
      cities: Map<string, number>;
    }>;
  }>();
  
  for (const { location } of applicants) {
    if (!location?.country) continue;
    
    const country = location.country;
    const state = location.state || '(No State)';
    const city = location.city || '(No City)';
    
    if (!countryMap.has(country)) {
      countryMap.set(country, { count: 0, states: new Map() });
    }
    const countryData = countryMap.get(country)!;
    countryData.count++;
    
    if (!countryData.states.has(state)) {
      countryData.states.set(state, { count: 0, cities: new Map() });
    }
    const stateData = countryData.states.get(state)!;
    stateData.count++;
    
    stateData.cities.set(city, (stateData.cities.get(city) || 0) + 1);
  }
  
  // Convert to sorted array structure
  const countries = Array.from(countryMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      states: Array.from(data.states.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([stateName, stateData]) => ({
          name: stateName,
          count: stateData.count,
          cities: Array.from(stateData.cities.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cityName, cityCount]) => ({
              name: cityName,
              count: cityCount,
            })),
        })),
    }));
  
  return { countries };
}

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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const jobId = searchParams.get('jobId');
    const passedHardGate = searchParams.get('passedHardGate');
    const searchQuery = searchParams.get('q');
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const experienceLevels = searchParams.get('experienceLevels')?.split(',').filter(Boolean) || [];
    const skip = (page - 1) * limit;

    // Get all job postings for this employer
    const employerJobs = await prisma.jobPosting.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        categorySkills: true,
        status: true,
      },
    });

    if (employerJobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          applicants: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          stats: { total: 0, passed: 0, failed: 0, newApplicants: 0 },
          spotlights: {
            activeApplicants: 0,
            passedScreening: 0,
            interestedInCompany: 0,
          },
        },
      });
    }

    const jobIds = jobId ? [jobId] : employerJobs.map(j => j.id);

    // Build where clause for matches
    const whereClause: Record<string, unknown> = {
      jobPostingId: { in: jobIds },
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
    } else if (sortBy === 'screening') {
      orderBy = { passedHardGate: 'desc' };
    }

    // Get total count (before candidate filtering)
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
        jobPosting: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            categorySkills: true,
          },
        },
      },
      orderBy,
    });

    // Apply search and filter on the results
    let filteredApplicants = applicants;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredApplicants = filteredApplicants.filter(a => {
        const name = a.candidate.name?.toLowerCase() || '';
        const email = a.candidate.email.toLowerCase();
        const cvData = a.cv?.extractedData as Record<string, unknown> | null;
        const headline = (cvData?.headline as string || '').toLowerCase();
        return name.includes(query) || email.includes(query) || headline.includes(query);
      });
    }

    // Skills filter
    if (skills.length > 0) {
      filteredApplicants = filteredApplicants.filter(a => {
        const candidateSkills = a.candidate.categorySkills || [];
        return skills.some(skill => 
          candidateSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }

    // Locations filter - supports hierarchical filtering (country, state, city)
    // Filter format: "country:Australia" or "state:Victoria" or "city:Melbourne"
    if (locations.length > 0) {
      filteredApplicants = filteredApplicants.filter(a => {
        const profile = a.candidate.profile as Record<string, unknown> | null;
        const profileCvData = profile?.cv_data as Record<string, unknown> | null;
        const personalInfo = (profile?.personal || profileCvData?.personal) as { location?: unknown } | null;
        
        // Parse location to structured format
        const locationData = personalInfo?.location || a.candidate.workAuthCountries?.[0];
        const parsedLocation = parseLocation(locationData);
        
        if (!parsedLocation) return false;
        
        return locations.some(locFilter => {
          const lowerFilter = locFilter.toLowerCase();
          
          // Check if filter has type prefix (country:, state:, city:)
          if (lowerFilter.startsWith('country:')) {
            const countryFilter = lowerFilter.replace('country:', '').trim();
            return parsedLocation.country?.toLowerCase() === countryFilter;
          } else if (lowerFilter.startsWith('state:')) {
            const stateFilter = lowerFilter.replace('state:', '').trim();
            return parsedLocation.state?.toLowerCase() === stateFilter;
          } else if (lowerFilter.startsWith('city:')) {
            const cityFilter = lowerFilter.replace('city:', '').trim();
            return parsedLocation.city?.toLowerCase() === cityFilter;
          }
          
          // Fallback: match any field (backward compatibility)
          const country = parsedLocation.country?.toLowerCase() || '';
          const state = parsedLocation.state?.toLowerCase() || '';
          const city = parsedLocation.city?.toLowerCase() || '';
          return country.includes(lowerFilter) || state.includes(lowerFilter) || city.includes(lowerFilter);
        });
      });
    }

    // Experience level filter
    if (experienceLevels.length > 0) {
      filteredApplicants = filteredApplicants.filter(a => {
        const candidateLevel = a.candidate.experienceLevel;
        return candidateLevel && experienceLevels.includes(candidateLevel);
      });
    }

    // Paginate filtered results
    const paginatedApplicants = filteredApplicants.slice(skip, skip + limit);

    // Calculate statistics
    const stats = await prisma.candidateJobMatch.groupBy({
      by: ['passedHardGate'],
      where: {
        jobPostingId: { in: jobIds },
        isActive: true,
      },
      _count: true,
    });

    const passedCount = stats.find(s => s.passedHardGate)?._count || 0;
    const failedCount = stats.find(s => !s.passedHardGate)?._count || 0;

    // Count new (unviewed) applicants
    const newApplicantsCount = await prisma.candidateJobMatch.count({
      where: {
        jobPostingId: { in: jobIds },
        isActive: true,
        employerViewed: false,
      },
    });

    // Count interested candidates
    const interestedCount = await prisma.candidateJobMatch.count({
      where: {
        jobPostingId: { in: jobIds },
        isActive: true,
        candidateInterested: true,
      },
    });

    // Format response
    const formattedApplicants = paginatedApplicants.map(applicant => {
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
        location?: unknown;
        linkedin_url?: string;
      } | null;
      
      // Parse location to get display string
      const parsedLocation = parseLocation(personalInfo?.location || applicant.candidate.workAuthCountries?.[0]);
      const locationDisplay = getLocationDisplayString(parsedLocation);
      
      // Calculate skills match
      const jobSkills = applicant.jobPosting.categorySkills || [];
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
        jobPosting: {
          id: applicant.jobPosting.id,
          title: applicant.jobPosting.jobTitle,
          companyName: applicant.jobPosting.companyName,
        },
        candidate: {
          id: applicant.candidate.id,
          name: applicant.candidate.name || personalInfo?.full_name || 'Anonymous',
          email: applicant.candidate.email,
          avatarUrl: applicant.candidate.avatarUrl,
          headline: (profile?.headline || applicant.candidate.categories?.join(' | ') || '') as string,
          location: locationDisplay,
          locationData: parsedLocation, // Structured location data for filtering
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

    // Get skills and locations with counts for filter options
    const skillCounts = new Map<string, number>();
    const experienceLevelCounts = new Map<string, number>();
    const locationDataList: Array<{ location: StructuredLocation | null }> = [];
    
    applicants.forEach(a => {
      // Extract skills from profile
      const profile = a.candidate.profile as Record<string, unknown> | null;
      const profileCvData = profile?.cv_data as Record<string, unknown> | null;
      const profileSkills = profile?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
      const cvDataSkills = profileCvData?.skills as { technical_skills?: string[]; soft_skills?: string[] } | null;
      
      // Count technical and soft skills from profile
      const addSkill = (s: string) => {
        if (s && s.trim()) {
          const normalized = s.trim();
          skillCounts.set(normalized, (skillCounts.get(normalized) || 0) + 1);
        }
      };
      
      profileSkills?.technical_skills?.forEach(addSkill);
      profileSkills?.soft_skills?.forEach(addSkill);
      cvDataSkills?.technical_skills?.forEach(addSkill);
      cvDataSkills?.soft_skills?.forEach(addSkill);
      
      // Fallback to categorySkills
      a.candidate.categorySkills?.forEach(addSkill);
      
      // Extract and parse location from profile (supports both old and new formats)
      const personalInfo = (profile?.personal || profileCvData?.personal) as { location?: unknown } | null;
      const locationData = personalInfo?.location || a.candidate.workAuthCountries?.[0];
      const parsedLocation = parseLocation(locationData);
      locationDataList.push({ location: parsedLocation });
      
      // Count experience levels
      const expLevel = a.candidate.experienceLevel;
      if (expLevel) {
        experienceLevelCounts.set(expLevel, (experienceLevelCounts.get(expLevel) || 0) + 1);
      }
    });
    
    // Sort by count (descending) and convert to array with counts
    const sortedSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, count]) => ({ name, count }));
    
    // Build hierarchical location structure
    const locationHierarchy = buildLocationHierarchy(locationDataList);
    
    const sortedExperienceLevels = Array.from(experienceLevelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: employerJobs.map(j => ({
          id: j.id,
          title: j.jobTitle,
          status: j.status,
        })),
        applicants: formattedApplicants,
        pagination: {
          page,
          limit,
          total: filteredApplicants.length,
          totalPages: Math.ceil(filteredApplicants.length / limit),
        },
        stats: {
          total: totalCount,
          passed: passedCount,
          failed: failedCount,
          newApplicants: newApplicantsCount,
        },
        spotlights: {
          activeApplicants: totalCount,
          passedScreening: passedCount,
          interestedInCompany: interestedCount,
        },
        filterOptions: {
          skills: sortedSkills,
          locations: locationHierarchy,
          experienceLevels: sortedExperienceLevels,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching employer applicants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}

