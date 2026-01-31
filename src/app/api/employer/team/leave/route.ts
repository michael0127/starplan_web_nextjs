/**
 * Leave Team API
 * POST /api/employer/team/leave - Leave the current team
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';

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

// POST - Leave team
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Get user's current membership
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        company: true,
        user: true
      }
    });

    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NOT_A_MEMBER }, { status: 404 });
    }

    // Owner cannot leave
    if (membership.role === 'OWNER') {
      return NextResponse.json({ error: TEAM_ERRORS.OWNER_CANNOT_LEAVE }, { status: 403 });
    }

    // Deactivate membership
    await prisma.organizationMember.update({
      where: { id: membership.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: user.id
      }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: membership.companyId,
        userId: user.id,
        action: 'member_left',
        targetType: 'member',
        targetId: membership.id,
        details: {
          email: membership.user.email,
          role: membership.role
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'You have left the team'
    });

  } catch (error) {
    console.error('Error leaving team:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
