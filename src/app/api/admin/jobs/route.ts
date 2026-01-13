import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Verify JWT token
function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const token = authHeader.substring(7);
    if (!verifyToken(token)) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // PUBLISHED, DRAFT, CLOSED, ARCHIVED
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by job title or company name
    if (search) {
      where.OR = [
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' }, // Published first
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          status: true,
          countryRegion: true,
          workType: true,
          createdAt: true,
          categories: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      jobs: jobs.map(j => ({
        id: j.id,
        jobTitle: j.jobTitle,
        companyName: j.companyName,
        status: j.status,
        countryRegion: j.countryRegion,
        workType: j.workType,
        categories: j.categories || [],
        createdAt: j.createdAt.toISOString(),
        employer: {
          email: j.user.email,
          name: j.user.name,
        },
        // Display label for select
        label: `${j.jobTitle} @ ${j.companyName} (${j.status})`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin jobs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
