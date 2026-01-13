import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Verify JWT token
function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const token = authHeader.substring(7);
    if (!verifyToken(token)) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause - only candidates
    const where: any = {
      userType: 'CANDIDATE',
    };

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch candidates with pagination
    const [candidates, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          preferredLocation: true,
          categories: true,
          createdAt: true,
          hasCompletedOnboarding: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      candidates: candidates.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name || 'No Name',
        preferredLocation: c.preferredLocation,
        categories: c.categories || [],
        createdAt: c.createdAt.toISOString(),
        hasCompletedOnboarding: c.hasCompletedOnboarding,
        // Display label for select
        label: `${c.name || 'No Name'} (${c.email})${c.categories?.length ? ` - ${c.categories.slice(0, 2).join(', ')}` : ''}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin candidates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
