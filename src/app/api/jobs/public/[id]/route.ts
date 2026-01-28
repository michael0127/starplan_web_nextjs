import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs/public/[id] - Get a single published job posting (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.jobPosting.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        companyLogo: true,
        companyCoverImage: true,
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
        jobDescription: true,
        keySellingPoint1: true,
        keySellingPoint2: true,
        keySellingPoint3: true,
        applicationDeadline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    });

  } catch (error) {
    console.error('Error fetching job posting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job posting' },
      { status: 500 }
    );
  }
}
