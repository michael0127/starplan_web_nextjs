import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs/public - Get all published job postings (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        status: 'PUBLISHED',
        ...(search && {
          OR: [
            { jobTitle: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { countryRegion: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        companyLogo: true,
        countryRegion: true,
        workType: true,
        experienceLevel: true,
        experienceYearsFrom: true,
        experienceYearsTo: true,
        payFrom: true,
        payTo: true,
        payType: true,
        currency: true,
        showSalaryOnAd: true,
        salaryDisplayText: true,
        categories: true,
        categorySkills: true,
        jobSummary: true,
        keySellingPoint1: true,
        keySellingPoint2: true,
        keySellingPoint3: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform for frontend
    const jobs = jobPostings.map(job => ({
      id: job.id,
      title: job.jobTitle,
      company: {
        name: job.companyName,
        logo: job.companyLogo,
      },
      location: job.countryRegion,
      type: job.workType,
      level: job.experienceLevel,
      experienceYears: job.experienceYearsFrom 
        ? `${job.experienceYearsFrom}${job.experienceYearsTo && job.experienceYearsTo !== 'Unlimited' ? `-${job.experienceYearsTo}` : '+'}` 
        : null,
      salary: job.showSalaryOnAd && job.payFrom && job.payTo 
        ? `${job.currency} ${Number(job.payFrom).toLocaleString()} - ${Number(job.payTo).toLocaleString()}${job.payType === 'ANNUAL' ? '/yr' : job.payType === 'HOURLY' ? '/hr' : ''}`
        : job.salaryDisplayText || null,
      categories: job.categories,
      skills: job.categorySkills || [],
      summary: job.jobSummary || null,
      highlights: [job.keySellingPoint1, job.keySellingPoint2, job.keySellingPoint3].filter(Boolean),
      createdAt: job.createdAt,
    }));

    return NextResponse.json({
      success: true,
      jobPostings: jobs,
      total: jobs.length,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    });

  } catch (error) {
    console.error('Error fetching public job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings', jobPostings: [] },
      { status: 500 }
    );
  }
}
