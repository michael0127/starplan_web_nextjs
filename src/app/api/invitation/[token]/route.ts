/**
 * Public Invitation API
 * GET /api/invitation/[token] - Get invitation details (public)
 * POST /api/invitation/[token] - Accept or decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { TEAM_ERRORS } from '@/lib/team-errors';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Get invitation details (public, no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            companyName: true,
            companyLogo: true
          }
        },
        inviter: {
          select: {
            name: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ 
        success: false, 
        error: TEAM_ERRORS.INVITATION_NOT_FOUND 
      }, { status: 404 });
    }

    // Check if expired
    const isExpired = invitation.expiresAt < new Date();
    
    // Update status if expired
    if (isExpired && invitation.status === 'PENDING') {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
    }

    // Check if already responded
    if (['ACCEPTED', 'DECLINED', 'REVOKED'].includes(invitation.status)) {
      return NextResponse.json({
        success: false,
        error: TEAM_ERRORS.INVITATION_ALREADY_RESPONDED,
        data: {
          status: invitation.status
        }
      }, { status: 400 });
    }

    if (isExpired || invitation.status === 'EXPIRED') {
      return NextResponse.json({
        success: false,
        error: TEAM_ERRORS.INVITATION_EXPIRED,
        data: {
          status: 'EXPIRED'
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        company: {
          companyName: invitation.company.companyName,
          companyLogo: invitation.company.companyLogo
        },
        invitedBy: {
          name: invitation.inviter.name
        },
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        expiresAt: invitation.expiresAt.toISOString(),
        isExpired: false
      }
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}

// POST - Accept or decline invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action } = body as { action: 'accept' | 'decline' };

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: TEAM_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    // Get invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        company: true
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_NOT_FOUND }, { status: 404 });
    }

    // Check if expired
    if (invitation.expiresAt < new Date() || invitation.status === 'EXPIRED') {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_EXPIRED }, { status: 400 });
    }

    // Check if already responded
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: TEAM_ERRORS.INVITATION_ALREADY_RESPONDED }, { status: 400 });
    }

    // Get current user from auth header (optional - user might be logged in or not)
    let currentUser = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const authToken = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(authToken);
      currentUser = user;
    }

    if (action === 'decline') {
      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'DECLINED',
          respondedAt: new Date()
        }
      });

      // Log activity
      await prisma.organizationActivityLog.create({
        data: {
          companyId: invitation.companyId,
          userId: invitation.invitedBy,
          action: 'invitation_declined',
          targetType: 'invitation',
          targetId: invitation.id,
          details: {
            email: invitation.email
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    }

    // Action is 'accept'
    // Check if user is logged in
    if (!currentUser) {
      // User needs to log in or sign up first
      // Return info for frontend to handle
      return NextResponse.json({
        success: false,
        error: 'AUTH_REQUIRED',
        data: {
          email: invitation.email,
          invitationToken: token,
          message: 'Please sign in or create an account to accept this invitation'
        }
      }, { status: 401 });
    }

    // Verify email matches
    if (currentUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'EMAIL_MISMATCH',
        data: {
          invitedEmail: invitation.email,
          currentEmail: currentUser.email,
          message: 'You are logged in with a different email address'
        }
      }, { status: 403 });
    }

    // Check if user is already a member of this company
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        companyId: invitation.companyId,
        userId: currentUser.id,
        isActive: true
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: TEAM_ERRORS.ALREADY_MEMBER }, { status: 400 });
    }

    // Use transaction to accept invitation
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
          acceptedUserId: currentUser.id
        }
      });

      // Create organization membership
      await tx.organizationMember.create({
        data: {
          companyId: invitation.companyId,
          userId: currentUser.id,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          joinedAt: new Date(),
          isActive: true
        }
      });

      // Update user type to EMPLOYER if not already
      await tx.user.update({
        where: { id: currentUser.id },
        data: { userType: 'EMPLOYER' }
      });

      // Log activity
      await tx.organizationActivityLog.create({
        data: {
          companyId: invitation.companyId,
          userId: currentUser.id,
          action: 'invitation_accepted',
          targetType: 'invitation',
          targetId: invitation.id,
          details: {
            email: invitation.email,
            role: invitation.role
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted',
      data: {
        companyId: invitation.companyId,
        redirectUrl: '/employer/dashboard'
      }
    });

  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json({ error: TEAM_ERRORS.INTERNAL_ERROR }, { status: 500 });
  }
}
