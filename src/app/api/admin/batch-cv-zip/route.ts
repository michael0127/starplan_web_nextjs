import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get the auto_invite query parameter
    const searchParams = request.nextUrl.searchParams;
    const autoInvite = searchParams.get('auto_invite') === 'true';

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // Build the backend URL with query parameters
    const backendUrl = new URL('/api/v1/cv-extraction/batch_extract_zip', BACKEND_URL);
    if (autoInvite) {
      backendUrl.searchParams.set('auto_invite', 'true');
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
    console.error('Error in batch-cv-zip route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

