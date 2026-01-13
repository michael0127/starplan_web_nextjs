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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: candidateId } = await params;

    // Fetch CVs for the candidate
    const cvs = await prisma.cV.findMany({
      where: {
        userId: candidateId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileUrl: true,
        createdAt: true,
        extractedData: true,
      },
    });

    return NextResponse.json({
      cvs: cvs.map((cv, index) => {
        // Extract filename from URL or use date
        const filename = cv.fileUrl.split('/').pop() || `CV ${index + 1}`;
        const uploadDate = new Date(cv.createdAt).toLocaleDateString();
        
        return {
          id: cv.id,
          fileUrl: cv.fileUrl,
          filename,
          createdAt: cv.createdAt.toISOString(),
          hasExtractedData: !!cv.extractedData,
          // Display label for select
          label: `${filename} (${uploadDate})`,
        };
      }),
    });
  } catch (error) {
    console.error('Admin candidate CVs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
