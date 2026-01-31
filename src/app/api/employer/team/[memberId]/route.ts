/**
 * Team Member Management API
 * PUT /api/employer/team/[memberId] - Update member role
 * DELETE /api/employer/team/[memberId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';
import { OrganizationRole } from '@/types/team';

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
    // Check if user has a company directly (legacy)
    const userWithCompany = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (userWithCompany?.company) {
      // Create membership record
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

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

// PUT - Update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const currentMembership = await getUserMembership(user.id);
    if (!currentMembership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Only OWNER can change roles
    if (currentMembership.role !== 'OWNER') {
      return NextResponse.json({ error: TEAM_ERRORS.ONLY_OWNER_CAN_CHANGE_ROLES }, { status: 403 });
    }

    // Get target member
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!targetMember || targetMember.companyId !== currentMembership.companyId) {
      return NextResponse.json({ error: TEAM_ERRORS.MEMBER_NOT_FOUND }, { status: 404 });
    }

    // Cannot change owner's role
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: TEAM_ERRORS.CANNOT_CHANGE_OWNER_ROLE }, { status: 403 });
    }

    // Cannot change own role
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: TEAM_ERRORS.CANNOT_CHANGE_OWN_ROLE }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body as { role: 'ADMIN' | 'MEMBER' };

    // Validate role
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    const oldRole = targetMember.role;

    // Update role
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: role }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: currentMembership.companyId,
        userId: user.id,
        action: 'role_changed',
        targetType: 'member',
        targetId: targetMember.id,
        details: {
          email: targetMember.user.email,
          oldRole: oldRole,
          newRole: role
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMember.id,
        role: updatedMember.role,
        updatedAt: updatedMember.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}

// DELETE - Remove member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const currentMembership = await getUserMembership(user.id);
    if (!currentMembership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Get target member
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!targetMember || targetMember.companyId !== currentMembership.companyId) {
      return NextResponse.json({ error: TEAM_ERRORS.MEMBER_NOT_FOUND }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: TEAM_ERRORS.CANNOT_REMOVE_OWNER }, { status: 403 });
    }

    // Cannot remove self (use leave instead)
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: TEAM_ERRORS.CANNOT_REMOVE_SELF }, { status: 403 });
    }

    // MEMBER cannot remove anyone
    if (currentMembership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    // ADMIN cannot remove other ADMINs
    if (currentMembership.role === 'ADMIN' && targetMember.role === 'ADMIN') {
      return NextResponse.json({ error: TEAM_ERRORS.ADMIN_CANNOT_REMOVE_ADMIN }, { status: 403 });
    }

    // Soft delete (deactivate) the member
    await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: user.id
      }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: currentMembership.companyId,
        userId: user.id,
        action: 'member_removed',
        targetType: 'member',
        targetId: targetMember.id,
        details: {
          email: targetMember.user.email,
          role: targetMember.role
        }
      }
    });

    // TODO: Send removal notification email

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
