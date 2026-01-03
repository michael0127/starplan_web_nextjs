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

    // Fetch dashboard statistics
    const [
      totalUsers,
      candidateCount,
      employerCount,
      totalJobs,
      publishedJobs,
      draftJobs,
      totalMatches,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Candidates
      prisma.user.count({
        where: { userType: 'CANDIDATE' }
      }),
      
      // Employers
      prisma.user.count({
        where: { userType: 'EMPLOYER' }
      }),
      
      // Total jobs
      prisma.jobPosting.count(),
      
      // Published jobs
      prisma.jobPosting.count({
        where: { status: 'PUBLISHED' }
      }),
      
      // Draft jobs
      prisma.jobPosting.count({
        where: { status: 'DRAFT' }
      }),
      
      // Total matches
      prisma.candidateJobMatch.count(),
      
      // Recent users (last 10)
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
      
      // Recent jobs (last 10)
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
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        candidateCount,
        employerCount,
        totalJobs,
        publishedJobs,
        draftJobs,
        totalMatches,
        systemStatus: 'operational',
      },
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || 'N/A',
        userType: user.userType,
        createdAt: user.createdAt.toISOString(),
      })),
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

