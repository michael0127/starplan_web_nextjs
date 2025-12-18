/**
 * Cron Job: Archive Expired Job Postings
 * This endpoint should be called periodically (e.g., daily) to archive expired jobs
 * 
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/archive-expired-jobs",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { archiveExpiredJobPostings, getExpiredJobPostings } from '@/lib/jobPostingExpiry';

export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get list of expired jobs before archiving
    const expiredJobIds = await getExpiredJobPostings();
    
    // Archive them
    const archivedCount = await archiveExpiredJobPostings();

    return NextResponse.json({
      success: true,
      archivedCount,
      expiredJobIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to archive expired jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

