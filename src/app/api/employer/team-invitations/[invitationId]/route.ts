/**
 * Team Invitation Management API
 * PUT /api/employer/team-invitations/[invitationId] - Resend invitation
 * DELETE /api/employer/team-invitations/[invitationId] - Revoke invitation
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

// Helper to resend team invitation email via backend service
async function resendTeamInvitationEmail(params: {
  toEmail: string;
  inviterName: string;
  companyName: string;
  role: string;
  invitationToken: string;
  message?: string;
}) {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${backendUrl}/api/v1/team-email/resend-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_email: params.toEmail,
        inviter_name: params.inviterName,
        company_name: params.companyName,
        role: params.role,
        invitation_token: params.invitationToken,
        message: params.message || null,
        app_url: appUrl
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to resend team invitation email:', errorData);
      return { success: false, error: errorData };
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling backend email service:', error);
    return { success: false, error: String(error) };
  }
}

interface RouteParams {
  params: Promise<{ invitationId: string }>;
}

// PUT - Resend invitation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = await params;
    
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Get invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.companyId !== membership.companyId) {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_NOT_FOUND }, { status: 404 });
    }

    // Only PENDING or EXPIRED invitations can be resent
    if (!['PENDING', 'EXPIRED'].includes(invitation.status)) {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_ALREADY_RESPONDED }, { status: 400 });
    }

    // Check permission: OWNER can resend any, ADMIN can only resend their own
    if (membership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    if (membership.role === 'ADMIN' && invitation.invitedBy !== user.id) {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    // Extend expiration by 7 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updatedInvitation = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'PENDING',
        expiresAt: newExpiresAt
      }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: membership.companyId,
        userId: user.id,
        action: 'invitation_resent',
        targetType: 'invitation',
        targetId: invitation.id,
        details: {
          email: invitation.email
        }
      }
    });

    // Get inviter's name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true }
    });
    const inviterName = inviter?.name || inviter?.email || 'A team member';

    // Resend invitation email via backend Celery task
    const emailResult = await resendTeamInvitationEmail({
      toEmail: invitation.email,
      inviterName: inviterName,
      companyName: membership.company.companyName || 'the company',
      role: invitation.role,
      invitationToken: updatedInvitation.token
    });

    if (!emailResult.success) {
      console.warn('Invitation updated but email failed to resend:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedInvitation.id,
        expiresAt: updatedInvitation.expiresAt.toISOString(),
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}

// DELETE - Revoke invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = await params;
    
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Get invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.companyId !== membership.companyId) {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_NOT_FOUND }, { status: 404 });
    }

    // Only PENDING invitations can be revoked
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_ALREADY_RESPONDED }, { status: 400 });
    }

    // Check permission
    if (membership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.ONLY_ADMIN_CAN_REVOKE }, { status: 403 });
    }

    if (membership.role === 'ADMIN' && invitation.invitedBy !== user.id) {
      return NextResponse.json({ error: TEAM_ERRORS.INSUFFICIENT_PERMISSION }, { status: 403 });
    }

    // Revoke invitation
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REVOKED',
        respondedAt: new Date()
      }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: membership.companyId,
        userId: user.id,
        action: 'invitation_revoked',
        targetType: 'invitation',
        targetId: invitation.id,
        details: {
          email: invitation.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked'
    });

  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
