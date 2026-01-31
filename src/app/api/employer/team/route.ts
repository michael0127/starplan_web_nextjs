/**
 * Team Management API
 * GET /api/employer/team - Get team members list
 * POST /api/employer/team - Invite a new member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';
import { OrganizationRole, TeamMember, TeamListResponse } from '@/types/team';

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

// Helper to get user's membership in their company
async function getUserMembership(userId: string, preferredCompanyId?: string) {
  // First get the user's company (as owner via the Company.userId relation)
  const userWithCompany = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      organizationMemberships: {
        where: { isActive: true },
        include: { company: true },
        orderBy: { joinedAt: 'desc' } // Most recently joined first
      }
    }
  });

  if (!userWithCompany) {
    return null;
  }

  // Check if user is a member of any company
  if (userWithCompany.organizationMemberships.length > 0) {
    // If preferredCompanyId is provided, try to find that membership
    if (preferredCompanyId) {
      const preferredMembership = userWithCompany.organizationMemberships.find(
        m => m.companyId === preferredCompanyId
      );
      if (preferredMembership) {
        return {
          companyId: preferredMembership.companyId,
          role: preferredMembership.role as OrganizationRole,
          company: preferredMembership.company,
          allMemberships: userWithCompany.organizationMemberships
        };
      }
    }
    
    // Return the most recently joined membership
    const membership = userWithCompany.organizationMemberships[0];
    return {
      companyId: membership.companyId,
      role: membership.role as OrganizationRole,
      company: membership.company,
      allMemberships: userWithCompany.organizationMemberships
    };
  }

  // If user has a company directly (legacy - they are the owner)
  if (userWithCompany.company) {
    // Check if there's already a membership record, if not they are implicitly the owner
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        companyId_userId: {
          companyId: userWithCompany.company.id,
          userId: userId
        }
      }
    });

    if (!existingMembership) {
      // Create owner membership record for legacy users
      await prisma.organizationMember.create({
        data: {
          companyId: userWithCompany.company.id,
          userId: userId,
          role: 'OWNER',
          joinedAt: userWithCompany.company.createdAt,
          isActive: true
        }
      });
    }

    return {
      companyId: userWithCompany.company.id,
      role: 'OWNER' as OrganizationRole,
      company: userWithCompany.company
    };
  }

  return null;
}

// GET - List team members
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Allow switching companies via query parameter
    const { searchParams } = new URL(request.url);
    const preferredCompanyId = searchParams.get('companyId') || undefined;

    const membership = await getUserMembership(user.id, preferredCompanyId);
    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Get all active members of the company
    const members = await prisma.organizationMember.findMany({
      where: {
        companyId: membership.companyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { joinedAt: 'asc' }
      ]
    });

    // Get pending invitations count
    const pendingInvitations = await prisma.teamInvitation.count({
      where: {
        companyId: membership.companyId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    // Format response
    const teamMembers: TeamMember[] = members.map(member => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      avatarUrl: member.user.avatarUrl,
      role: member.role as OrganizationRole,
      joinedAt: member.joinedAt?.toISOString() || null,
      isCurrentUser: member.userId === user.id
    }));

    // Include available companies for switching
    const availableCompanies = membership.allMemberships?.map(m => ({
      id: m.companyId,
      companyName: m.company.companyName,
      companyLogo: m.company.companyLogo,
      role: m.role as OrganizationRole
    })) || [{
      id: membership.companyId,
      companyName: membership.company.companyName,
      companyLogo: membership.company.companyLogo,
      role: membership.role
    }];

    const response: TeamListResponse = {
      company: {
        id: membership.companyId,
        companyName: membership.company.companyName,
        companyLogo: membership.company.companyLogo
      },
      members: teamMembers,
      currentUserRole: membership.role,
      pendingInvitations,
      availableCompanies
    };

    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}

// Helper to send team invitation email via backend service
async function sendTeamInvitationEmail(params: {
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
    const response = await fetch(`${backendUrl}/api/v1/team-email/send-invitation`, {
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
      console.error('Failed to send team invitation email:', errorData);
      return { success: false, error: errorData };
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling backend email service:', error);
    return { success: false, error: String(error) };
  }
}

// POST - Invite a new member
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: TEAM_ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    if (!membership) {
      return NextResponse.json({ error: TEAM_ERRORS.NO_COMPANY }, { status: 404 });
    }

    // Check permission: only OWNER and ADMIN can invite
    if (membership.role === 'MEMBER') {
      return NextResponse.json({ error: TEAM_ERRORS.ONLY_ADMIN_CAN_INVITE }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, message } = body as {
      email: string;
      role: 'ADMIN' | 'MEMBER';
      message?: string;
    };

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    // Validate role
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    // ADMIN can only invite MEMBER
    if (membership.role === 'ADMIN' && role === 'ADMIN') {
      return NextResponse.json({ error: TEAM_ERRORS.ROLE_UPGRADE_DENIED }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        companyId: membership.companyId,
        user: { email: email.toLowerCase() },
        isActive: true
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: TEAM_ERRORS.ALREADY_MEMBER }, { status: 400 });
    }

    // Check for pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        companyId: membership.companyId,
        email: email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_PENDING }, { status: 400 });
    }

    // Get inviter's name from database
    const inviter = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true }
    });
    const inviterName = inviter?.name || inviter?.email || 'A team member';

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.teamInvitation.create({
      data: {
        companyId: membership.companyId,
        email: email.toLowerCase(),
        role: role,
        invitedBy: user.id,
        message: message || null,
        expiresAt: expiresAt,
        status: 'PENDING'
      }
    });

    // Log activity
    await prisma.organizationActivityLog.create({
      data: {
        companyId: membership.companyId,
        userId: user.id,
        action: 'member_invited',
        targetType: 'invitation',
        targetId: invitation.id,
        details: {
          email: email.toLowerCase(),
          role: role
        }
      }
    });

    // Send invitation email via backend Celery task
    const emailResult = await sendTeamInvitationEmail({
      toEmail: email.toLowerCase(),
      inviterName: inviterName,
      companyName: membership.company.companyName || 'the company',
      role: role,
      invitationToken: invitation.token,
      message: message
    });

    if (!emailResult.success) {
      console.warn('Team invitation created but email failed to send:', emailResult.error);
      // Don't fail the request, invitation is still created
    }

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
