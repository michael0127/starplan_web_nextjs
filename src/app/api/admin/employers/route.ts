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

    // Build where clause - only employers
    const where: any = {
      userType: 'EMPLOYER',
    };

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch employers
    const employers = await prisma.user.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        company: {
          select: {
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json({
      employers: employers.map(e => ({
        id: e.id,
        email: e.email,
        name: e.name || 'No Name',
        companyName: e.company?.companyName || null,
        createdAt: e.createdAt.toISOString(),
        // Display label for select
        label: e.company?.companyName 
          ? `${e.company.companyName} - ${e.name || e.email}`
          : `${e.name || 'No Name'} (${e.email})`,
      })),
    });
  } catch (error) {
    console.error('Admin employers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
