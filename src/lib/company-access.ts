/**
 * Company Access Helper Functions
 * Provides utilities for team data sharing within a company
 */

import { prisma } from '@/lib/prisma';
import { OrganizationRole } from '@/types/team';

/**
 * Company context with all member user IDs for data access
 */
export interface CompanyContext {
  companyId: string;
  companyName: string;
  role: OrganizationRole;
  userIds: string[]; // All active member user IDs in the company
}

/**
 * Get all active user IDs in a company
 */
export async function getCompanyUserIds(companyId: string): Promise<string[]> {
  const members = await prisma.organizationMember.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      userId: true,
    },
  });

  return members.map(m => m.userId);
}

/**
 * Get user's company context including all team member IDs
 * This is the main function to use for company-based data access
 */
export async function getUserCompanyContext(userId: string): Promise<CompanyContext | null> {
  // First check if user has an active membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  if (membership) {
    const userIds = await getCompanyUserIds(membership.companyId);
    return {
      companyId: membership.companyId,
      companyName: membership.company.companyName,
      role: membership.role as OrganizationRole,
      userIds,
    };
  }

  // Fallback: Check if user owns a company directly (legacy support)
  const userWithCompany = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  if (userWithCompany?.company) {
    // Create membership record for legacy owner
    await prisma.organizationMember.upsert({
      where: {
        companyId_userId: {
          companyId: userWithCompany.company.id,
          userId,
        },
      },
      create: {
        companyId: userWithCompany.company.id,
        userId,
        role: 'OWNER',
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });

    const userIds = await getCompanyUserIds(userWithCompany.company.id);
    return {
      companyId: userWithCompany.company.id,
      companyName: userWithCompany.company.companyName,
      role: 'OWNER',
      userIds,
    };
  }

  return null;
}

/**
 * Check if a user can modify a resource owned by another user
 * Used for write operations on shared company data
 */
export function canModifyOthersResource(
  role: OrganizationRole,
  isOwner: boolean
): boolean {
  // Owner can always modify
  // Admin can modify others' resources
  // Member can only modify their own
  if (isOwner) return true;
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Get a user's role in a specific company
 */
export async function getUserRoleInCompany(
  userId: string,
  companyId: string
): Promise<OrganizationRole | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive) {
    return null;
  }

  return membership.role as OrganizationRole;
}

/**
 * Check if a user can delete a resource owned by another user based on role hierarchy
 * OWNER can delete ADMIN and MEMBER resources
 * ADMIN can delete MEMBER resources only
 * MEMBER cannot delete others' resources
 */
export function canDeleteBasedOnRoleHierarchy(
  deleterRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  if (deleterRole === 'OWNER') {
    // OWNER can delete ADMIN and MEMBER
    return targetRole === 'ADMIN' || targetRole === 'MEMBER';
  }
  if (deleterRole === 'ADMIN') {
    // ADMIN can only delete MEMBER
    return targetRole === 'MEMBER';
  }
  // MEMBER cannot delete others
  return false;
}

/**
 * Check if user has access to a job posting (for read operations)
 * Returns true if the job belongs to any member of the user's company
 */
export async function hasJobAccess(
  userId: string,
  jobUserId: string
): Promise<boolean> {
  // If it's the user's own job, always allow
  if (userId === jobUserId) return true;

  const context = await getUserCompanyContext(userId);
  if (!context) return false;

  return context.userIds.includes(jobUserId);
}

/**
 * Check if user can modify a job posting
 */
export async function canModifyJob(
  userId: string,
  jobUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // User can always modify their own job
  if (userId === jobUserId) {
    return { allowed: true };
  }

  const context = await getUserCompanyContext(userId);
  if (!context) {
    return { allowed: false, reason: 'No company membership found' };
  }

  // Check if job owner is in the same company
  if (!context.userIds.includes(jobUserId)) {
    return { allowed: false, reason: 'Job does not belong to your company' };
  }

  // Check role permissions
  if (canModifyOthersResource(context.role, false)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Insufficient permissions to modify this job' };
}

/**
 * Check if user can delete a job posting
 * Rules:
 * - User can always delete their own job
 * - OWNER can delete ADMIN's and MEMBER's jobs
 * - ADMIN can delete MEMBER's jobs
 * - MEMBER cannot delete others' jobs
 */
export async function canDeleteJob(
  userId: string,
  jobUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // User can always delete their own job
  if (userId === jobUserId) {
    return { allowed: true };
  }

  const context = await getUserCompanyContext(userId);
  if (!context) {
    return { allowed: false, reason: 'No company membership found' };
  }

  // Check if job owner is in the same company
  if (!context.userIds.includes(jobUserId)) {
    return { allowed: false, reason: 'Job does not belong to your company' };
  }

  // Get the job owner's role in the company
  const jobOwnerRole = await getUserRoleInCompany(jobUserId, context.companyId);
  if (!jobOwnerRole) {
    return { allowed: false, reason: 'Job owner is not an active member of the company' };
  }

  // Check role hierarchy: OWNER > ADMIN > MEMBER
  if (canDeleteBasedOnRoleHierarchy(context.role, jobOwnerRole)) {
    return { allowed: true };
  }

  if (context.role === 'ADMIN') {
    return { allowed: false, reason: 'Admins can only delete jobs created by members' };
  }

  return { allowed: false, reason: 'Insufficient permissions to delete this job' };
}
