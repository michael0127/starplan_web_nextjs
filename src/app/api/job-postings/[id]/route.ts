import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { hasJobAccess, canModifyJob, canDeleteJob } from '@/lib/company-access';

// GET /api/job-postings/[id] - Get a specific job posting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: {
        id,
      },
      include: {
        systemScreeningAnswers: true,
        customScreeningQuestions: true,
        purchase: {
          select: {
            id: true,
            paymentStatus: true,
            paidAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this job (own job or same company)
    const hasAccess = await hasJobAccess(user.id, jobPosting.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobPosting,
    });

  } catch (error) {
    console.error('Error fetching job posting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job posting' },
      { status: 500 }
    );
  }
}

// DELETE /api/job-postings/[id] - Delete a specific job posting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        purchase: {
          select: {
            paymentStatus: true,
          },
        },
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Check if user can delete this job (own job or OWNER role in company)
    const deletePermission = await canDeleteJob(user.id, jobPosting.userId);
    if (!deletePermission.allowed) {
      return NextResponse.json(
        { error: deletePermission.reason || 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if job posting has a successful payment
    if (jobPosting.purchase && jobPosting.purchase.paymentStatus === 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Cannot delete a paid job posting. Please archive it instead.' },
        { status: 403 }
      );
    }

    await prisma.jobPosting.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting job posting:', error);
    return NextResponse.json(
      { error: 'Failed to delete job posting' },
      { status: 500 }
    );
  }
}

// PATCH /api/job-postings/[id] - Update job posting status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this job (own job or OWNER/ADMIN role in company)
    const modifyPermission = await canModifyJob(user.id, jobPosting.userId);
    if (!modifyPermission.allowed) {
      return NextResponse.json(
        { error: modifyPermission.reason || 'Forbidden' },
        { status: 403 }
      );
    }

    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: updatedJobPosting,
    });

  } catch (error) {
    console.error('Error updating job posting status:', error);
    return NextResponse.json(
      { error: 'Failed to update job posting status' },
      { status: 500 }
    );
  }
}

