/**
 * API Route: POST /api/employer/jd-upload
 * 
 * 用于雇主上传 JD 文件进行 AI 分析
 * 使用 Redis + Celery 异步任务接口
 * 返回任务 ID，前端需要轮询 /api/tasks/[taskId] 获取结果
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 异步任务提交响应
interface AsyncTaskResponse {
  task_id: string;
  total_files: number;
  status: string;
  message: string;
  query_url: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const saveToDb = searchParams.get('save_to_db') === 'true';
    const createJobPosting = searchParams.get('create_job_posting') !== 'false'; // default true
    const createSuccessfulPayment = searchParams.get('create_successful_payment') === 'true'; // default false for drafts
    const createAsDraft = searchParams.get('create_as_draft') !== 'false'; // default true for employer portal
    
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX files are supported.' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    backendFormData.append('files', file);

    // 使用 Celery 异步任务接口
    const backendUrl = new URL('/api/v1/tasks/jd/batch-analyze-async', BACKEND_URL);
    backendUrl.searchParams.set('save_to_db', saveToDb.toString());
    backendUrl.searchParams.set('create_job_posting', createJobPosting.toString());
    backendUrl.searchParams.set('create_successful_payment', createSuccessfulPayment.toString());
    backendUrl.searchParams.set('create_as_draft', createAsDraft.toString());
    backendUrl.searchParams.set('user_id', user.id);

    // Forward the request to the async backend service
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

    // 返回异步任务信息
    return NextResponse.json({
      success: true,
      async: true,
      taskId: data.task_id,
      totalFiles: data.total_files,
      status: data.status,
      message: 'JD 分析任务已提交，请轮询获取结果',
      pollUrl: `/api/tasks/${data.task_id}`,
    });
  } catch (error) {
    console.error('Error in employer jd-upload route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
