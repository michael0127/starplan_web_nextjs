import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const saveToDb = searchParams.get('save_to_db') === 'true';
    const userId = searchParams.get('user_id');
    
    // Get the form data from the request
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    files.forEach(file => {
      backendFormData.append('files', file);
    });

    // Build the backend URL with query parameters
    const backendUrl = new URL('/api/v1/jd/batch_analyze', BACKEND_URL);
    if (saveToDb) {
      backendUrl.searchParams.set('save_to_db', 'true');
      if (userId) {
        backendUrl.searchParams.set('user_id', userId);
      }
    }

    // Forward the request to the backend service
    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Backend processing failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in batch-jd route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

