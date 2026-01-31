/**
 * Team Activity Log API
 * GET /api/employer/team-activity - Get activity logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';
import { TeamActivityLog, TeamActivityResponse } from '@/types/team';

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper to get user's membership
async function getUserMembership(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: userId,
      isActive: true
    },
    include: {
      company: true
    }
  });

  if (!membership) {
    const userWithCompany = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (userWithCompany?.company) {
      const newMembership = await prisma.organizationMember.create({
        data: {
          companyId: userWithCompany.company.id,
          userId: userId,
          role: 'OWNER',
          joinedAt: userWithCompany.company.createdAt,
          isActive: true
        },
        include: { company: true }
      });
      return newMembership;
    }
    return null;
  }

  return membership;
}

// Action label mapping
const ACTION_LABELS: Record<string, string> = {
  'member_invited': 'Invited a new member',
  'member_removed': 'Removed a member',
  'member_left': 'Left the team',
  'role_changed': 'Changed member role',
  'ownership_transferred': 'Transferred ownership',
  'invitation_revoked': 'Revoked an invitation',
  'invitation_resent': 'Resent an invitation',
  'invitation_accepted': 'Invitation was accepted',
  'invitation_declined': 'Invitation was declined',
};

// GET - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Only OWNER and ADMIN can view activity logs
    if (membership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const actionFilter = searchParams.get('action');

    // Build where clause
    const whereClause: Record<string, unknown> = {
      companyId: membership.companyId
    };

    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    // Get total count
    const total = await prisma.organizationActivityLog.count({
      where: whereClause
    });

    // Get logs with pagination
    const logs = await prisma.organizationActivityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get user info for all logs
    const userIds = [...new Set(logs.map(log => log.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Format logs
    const formattedLogs: TeamActivityLog[] = logs.map(log => {
      const logUser = userMap.get(log.userId);
      const details = log.details as Record<string, unknown> | null;
      
      return {
        id: log.id,
        action: log.action,
        actionLabel: ACTION_LABELS[log.action] || log.action,
        user: {
          id: log.userId,
          name: logUser?.name || null,
          email: logUser?.email || 'Unknown'
        },
        target: {
          type: log.targetType,
          id: log.targetId,
          name: details?.name as string | undefined,
          email: details?.email as string | undefined
        },
        details: details,
        createdAt: log.createdAt.toISOString()
      };
    });

    const response: TeamActivityResponse = {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
