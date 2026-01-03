import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'starplan-admin-secret-key-change-in-production';

// Verify admin token
function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobPostings,
      publishedJobs,
      draftJobs,
      totalMatches,
      recentUsers,
      recentJobs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'CANDIDATE' } }),
      prisma.user.count({ where: { userType: 'EMPLOYER' } }),
      prisma.jobPosting.count(),
      prisma.jobPosting.count({ where: { status: 'PUBLISHED' } }),
      prisma.jobPosting.count({ where: { status: 'DRAFT' } }),
      prisma.candidateJobMatch.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          createdAt: true,
        }
      }),
      prisma.jobPosting.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          status: true,
          createdAt: true,
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobPostings,
      publishedJobs,
      draftJobs,
      totalMatches,
      recentUsers,
      recentJobs
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

