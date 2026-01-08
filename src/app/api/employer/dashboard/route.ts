/**
 * Employer Dashboard Stats API
 * GET /api/employer/dashboard
 * Returns dashboard statistics for the employer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

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

    // Get all job postings for this employer
    const jobPostings = await prisma.jobPosting.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
      },
    });

    // Count active job posts (published status)
    const activeJobPosts = jobPostings.filter(
      job => job.status === 'PUBLISHED'
    ).length;

    // Count total job posts
    const totalJobPosts = jobPostings.length;

    const jobIds = jobPostings.map(j => j.id);

    // Get applications count (all candidates who matched with any job)
    const applicationsCount = jobIds.length > 0
      ? await prisma.candidateJobMatch.count({
          where: {
            jobPostingId: { in: jobIds },
            isActive: true,
          },
        })
      : 0;

    // Get new (unviewed) applications count
    const newApplicationsCount = jobIds.length > 0
      ? await prisma.candidateJobMatch.count({
          where: {
            jobPostingId: { in: jobIds },
            isActive: true,
            employerViewed: false,
          },
        })
      : 0;

    // Get candidates who passed screening (matched)
    const candidatesMatchedCount = jobIds.length > 0
      ? await prisma.candidateJobMatch.count({
          where: {
            jobPostingId: { in: jobIds },
            isActive: true,
            passedHardGate: true,
          },
        })
      : 0;

    // Get candidates employer is interested in (potential interviews)
    const interestedCandidatesCount = jobIds.length > 0
      ? await prisma.candidateJobMatch.count({
          where: {
            jobPostingId: { in: jobIds },
            isActive: true,
            employerInterested: true,
          },
        })
      : 0;

    // Get mutual interest count (both employer and candidate interested)
    const mutualInterestCount = jobIds.length > 0
      ? await prisma.candidateJobMatch.count({
          where: {
            jobPostingId: { in: jobIds },
            isActive: true,
            employerInterested: true,
            candidateInterested: true,
          },
        })
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        activeJobPosts,
        totalJobPosts,
        applications: applicationsCount,
        newApplications: newApplicationsCount,
        candidatesMatched: candidatesMatchedCount,
        interviewsScheduled: interestedCandidatesCount, // Using interested count as proxy for interviews
        mutualInterest: mutualInterestCount,
      },
    });

  } catch (error) {
    console.error('Error fetching employer dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

