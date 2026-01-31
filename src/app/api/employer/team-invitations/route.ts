/**
 * Team Invitations API
 * GET /api/employer/team-invitations - List all invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';
import { TeamInvitation, OrganizationRole } from '@/types/team';

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

// GET - List invitations
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

    // Only OWNER and ADMIN can view invitations
    if (membership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    // Parse query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status')?.split(',') || [];

    // Build where clause
    const whereClause: Record<string, unknown> = {
      companyId: membership.companyId
    };

    if (statusFilter.length > 0) {
      whereClause.status = { in: statusFilter };
    }

    // Update expired invitations
    await prisma.teamInvitation.updateMany({
      where: {
        companyId: membership.companyId,
        status: 'PENDING',
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Get invitations
    const invitations = await prisma.teamInvitation.findMany({
      where: whereClause,
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response
    const formattedInvitations: TeamInvitation[] = invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role as OrganizationRole,
      status: inv.status as TeamInvitation['status'],
      message: inv.message,
      invitedBy: {
        id: inv.inviter.id,
        name: inv.inviter.name,
        email: inv.inviter.email
      },
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      respondedAt: inv.respondedAt?.toISOString() || null
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvitations
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
