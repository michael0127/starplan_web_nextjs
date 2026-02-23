import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AsyncTaskResponse {
  batch_task_id: string;
  total_files: number;
  status: string;
  message: string;
  query_url: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only ZIP files are supported.' },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('files', file);

    const backendUrl = new URL('/api/v1/tasks/cv/batch-extract-async', BACKEND_URL);
    backendUrl.searchParams.set('auto_invite', 'false');
    backendUrl.searchParams.set('create_user', 'true');

    const response = await fetch(backendUrl.toString(), {
      method: 'POST',
      body: backendFormData,
    });

    const data: AsyncTaskResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Backend processing failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      batchTaskId: data.batch_task_id,
      totalFiles: data.total_files,
      status: data.status,
      pollUrl: `/api/tasks/${data.batch_task_id}?batch=true`,
    });
  } catch (error) {
    console.error('Error in quick-rank upload-cv route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
