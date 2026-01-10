/**
 * Email Records API
 * GET /api/email/records - List email records sent by the employer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create a Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const recipientEmail = searchParams.get('recipientEmail');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      senderId: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (recipientEmail) {
      where.recipientEmail = {
        contains: recipientEmail,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.emailRecord.count({ where });

    // Get email records
    const records = await prisma.emailRecord.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        recipientEmail: true,
        recipientName: true,
        ccEmails: true,
        subject: true,
        status: true,
        resendId: true,
        errorMessage: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        createdAt: true,
      },
    });

    // Get stats
    const stats = await prisma.emailRecord.groupBy({
      by: ['status'],
      where: { senderId: user.id },
      _count: true,
    });

    const statsMap = stats.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total,
          sent: statsMap['SENT'] || 0,
          delivered: statsMap['DELIVERED'] || 0,
          opened: statsMap['OPENED'] || 0,
          clicked: statsMap['CLICKED'] || 0,
          bounced: statsMap['BOUNCED'] || 0,
          failed: statsMap['FAILED'] || 0,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching email records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch email records' 
      },
      { status: 500 }
    );
  }
}
