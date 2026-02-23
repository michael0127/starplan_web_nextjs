/**
 * API Route: POST /api/admin/batch-jd
 * 
 * 使用 Redis + Celery 异步任务接口批量分析 JD
 * 返回任务 ID，前端需要轮询 /api/tasks/[taskId] 获取结果
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface AsyncTaskResponse {
  batch_task_id: string;
  total_files: number;
  status: string;
  message: string;
  query_url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const saveToDb = searchParams.get('save_to_db') === 'true';
    const userId = searchParams.get('user_id');
    const createJobPosting = searchParams.get('create_job_posting') !== 'false'; // default true
    const createSuccessfulPayment = searchParams.get('create_successful_payment') !== 'false'; // default true
    
    // Get the form data from the request
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend (异步接口)
    const backendFormData = new FormData();
    files.forEach(file => {
      backendFormData.append('files', file);
    });

    // 使用 Celery 异步任务接口
    const backendUrl = new URL('/api/v1/tasks/jd/batch-analyze-async', BACKEND_URL);
    backendUrl.searchParams.set('save_to_db', saveToDb.toString());
    backendUrl.searchParams.set('create_job_posting', createJobPosting.toString());
    backendUrl.searchParams.set('create_successful_payment', createSuccessfulPayment.toString());
    if (userId) {
      backendUrl.searchParams.set('user_id', userId);
    }

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

    return NextResponse.json({
      success: true,
      async: true,
      batchTaskId: data.batch_task_id,
      totalFiles: data.total_files,
      status: data.status,
      pollUrl: `/api/tasks/${data.batch_task_id}?batch=true`,
    });
  } catch (error) {
    console.error('Error in batch-jd route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

