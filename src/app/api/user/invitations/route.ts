import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// GET /api/user/invitations - Get all invitations for the current candidate
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invitations for this candidate
    const invitations = await (prisma as any).candidateInvitation.findMany({
      where: { candidateId: user.id },
      include: {
        jobPosting: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            companyLogo: true,
            countryRegion: true,
            workType: true,
            status: true,
          },
        },
        screeningResponses: true,
      },
      orderBy: { sentAt: 'desc' },
    });

    // Map invitations with status info
    const invitationsData = invitations.map((inv: any) => ({
      id: inv.id,
      token: inv.token,
      jobPosting: inv.jobPosting,
      status: inv.status,
      message: inv.message,
      sentAt: inv.sentAt,
      viewedAt: inv.viewedAt,
      respondedAt: inv.respondedAt,
      expiresAt: inv.expiresAt,
      responsesCount: inv.screeningResponses?.length || 0,
      isExpired: new Date() > new Date(inv.expiresAt),
      isCompleted: inv.status === 'COMPLETED',
    }));

    // Calculate stats
    // Note: Both 'PENDING' and 'VIEWED' are considered as "pending" since candidate hasn't submitted yet
    const stats = {
      total: invitations.length,
      pending: invitations.filter((i: any) => 
        (i.status === 'PENDING' || i.status === 'VIEWED') && 
        new Date() <= new Date(i.expiresAt)
      ).length,
      completed: invitations.filter((i: any) => i.status === 'COMPLETED').length,
      expired: invitations.filter((i: any) => 
        new Date() > new Date(i.expiresAt) && 
        i.status !== 'COMPLETED'
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitationsData,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
