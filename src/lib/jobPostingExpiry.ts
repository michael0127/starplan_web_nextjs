/**
 * Job Posting Expiry Utilities
 * Functions to check and manage job posting expiration
 */

import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

/**
 * Check if a job posting is expired
 * @param jobPostingId - The ID of the job posting
 * @returns true if expired, false otherwise
 */
export async function isJobPostingExpired(jobPostingId: string): Promise<boolean> {
  try {
    const purchase = await prisma.jobPostingPurchase.findUnique({
      where: { jobPostingId },
      select: { expiresAt: true },
    });

    if (!purchase || !purchase.expiresAt) {
      return false; // No purchase or no expiry date means not expired
    }

    return new Date() > purchase.expiresAt;
  } catch (error) {
    console.error('Error checking job posting expiry:', error);
    return false;
  }
}

/**
 * Get all expired job postings that are still published
 * @returns Array of expired job posting IDs
 */
export async function getExpiredJobPostings(): Promise<string[]> {
  try {
    const now = new Date();
    
    const expiredPurchases = await prisma.jobPostingPurchase.findMany({
      where: {
        expiresAt: {
          lt: now, // less than now (expired)
        },
        jobPosting: {
          status: JobStatus.PUBLISHED, // Only get published jobs
        },
      },
      select: {
        jobPostingId: true,
      },
      take: 1000, // 添加 LIMIT 防止全表扫描
    });

    return expiredPurchases.map(p => p.jobPostingId);
  } catch (error) {
    console.error('Error getting expired job postings:', error);
    return [];
  }
}

/**
 * Close all expired job postings
 * This can be run as a cron job
 * @returns Number of jobs closed
 */
export async function archiveExpiredJobPostings(): Promise<number> {
  try {
    const expiredJobIds = await getExpiredJobPostings();

    if (expiredJobIds.length === 0) {
      return 0;
    }

    const result = await prisma.jobPosting.updateMany({
      where: {
        id: {
          in: expiredJobIds,
        },
      },
      data: {
        status: JobStatus.CLOSED,
      },
    });

    console.log(`Closed ${result.count} expired job postings`);
    return result.count;
  } catch (error) {
    console.error('Error closing expired job postings:', error);
    return 0;
  }
}

/**
 * Get days remaining until expiry
 * @param jobPostingId - The ID of the job posting
 * @returns Number of days remaining, null if no expiry, -1 if expired
 */
export async function getDaysUntilExpiry(jobPostingId: string): Promise<number | null> {
  try {
    const purchase = await prisma.jobPostingPurchase.findUnique({
      where: { jobPostingId },
      select: { expiresAt: true },
    });

    if (!purchase || !purchase.expiresAt) {
      return null; // No expiry date set
    }

    const now = new Date();
    const diffMs = purchase.expiresAt.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return -1; // Already expired
    }

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('Error getting days until expiry:', error);
    return null;
  }
}

/**
 * Get job postings expiring soon (within X days)
 * @param withinDays - Number of days to look ahead
 * @returns Array of job posting IDs expiring soon
 */
export async function getJobPostingsExpiringSoon(withinDays: number = 7): Promise<string[]> {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    
    const expiringSoon = await prisma.jobPostingPurchase.findMany({
      where: {
        expiresAt: {
          gte: now, // greater than or equal to now (not expired yet)
          lte: futureDate, // less than or equal to future date
        },
        jobPosting: {
          status: JobStatus.PUBLISHED,
        },
      },
      select: {
        jobPostingId: true,
        expiresAt: true,
      },
      take: 1000, // 添加 LIMIT 防止全表扫描
    });

    return expiringSoon.map(p => p.jobPostingId);
  } catch (error) {
    console.error('Error getting job postings expiring soon:', error);
    return [];
  }
}

/**
 * Check if job posting is valid (not expired)
 * Use this in API routes to validate access
 */
export async function isJobPostingValid(jobPostingId: string): Promise<boolean> {
  const expired = await isJobPostingExpired(jobPostingId);
  return !expired;
}

