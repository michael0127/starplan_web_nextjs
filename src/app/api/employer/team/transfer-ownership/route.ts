/**
 * Transfer Ownership API
 * POST /api/employer/team/transfer-ownership - Transfer company ownership to another member
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

// POST - Transfer ownership
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Get current user's membership
    const currentMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        company: true,
        user: true
      }
    });

    if (!currentMembership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Only OWNER can transfer ownership
    if (currentMembership.role !== 'OWNER') {
      return NextResponse.json({ error: TEAM_ERRORS.ONLY_OWNER_CAN_TRANSFER }, { status: 403 });
    }

    const body = await request.json();
    const { newOwnerId } = body as { newOwnerId: string };

    if (!newOwnerId) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    // Get target member
    const targetMembership = await prisma.organizationMember.findFirst({
      where: {
        companyId: currentMembership.companyId,
        userId: newOwnerId,
        isActive: true
      },
      include: { user: true }
    });

    if (!targetMembership) {
      return NextResponse.json({ error: TEAM_ERRORS.TARGET_NOT_MEMBER }, { status: 404 });
    }

    // Cannot transfer to self
    if (targetMembership.userId === user.id) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Demote current owner to ADMIN
      await tx.organizationMember.update({
        where: { id: currentMembership.id },
        data: { role: 'ADMIN' }
      });

      // Promote new owner
      await tx.organizationMember.update({
        where: { id: targetMembership.id },
        data: { role: 'OWNER' }
      });

      // Update the Company.userId to point to new owner
      await tx.company.update({
        where: { id: currentMembership.companyId },
        data: { userId: newOwnerId }
      });

      // Log activity
      await tx.organizationActivityLog.create({
        data: {
          companyId: currentMembership.companyId,
          userId: user.id,
          action: 'ownership_transferred',
          targetType: 'member',
          targetId: targetMembership.id,
          details: {
            previousOwner: {
              id: user.id,
              email: currentMembership.user.email
            },
            newOwner: {
              id: newOwnerId,
              email: targetMembership.user.email
            }
          }
        }
      });
    });

    // TODO: Send notification emails to both users

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully',
      data: {
        previousOwner: { id: user.id, newRole: 'ADMIN' },
        newOwner: { id: newOwnerId, role: 'OWNER' }
      }
    });

  } catch (error) {
    console.error('Error transferring ownership:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
