/**
 * API Route: POST /api/admin/batch-cv-zip
 * 
 * 使用 Redis + Celery 异步任务接口批量提取 CV（ZIP 压缩包）
 * 返回任务 ID，前端需要轮询 /api/tasks/[taskId] 获取结果
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

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
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const autoInvite = searchParams.get('auto_invite') === 'true';
    const createUser = searchParams.get('create_user') !== 'false'; // default true

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend (异步接口支持 ZIP)
    const backendFormData = new FormData();
    // 将 ZIP 文件作为 files 数组发送，后端异步接口会自动解压
    backendFormData.append('files', file);

    // 使用 Celery 异步任务接口 (支持 ZIP 自动解压)
    const backendUrl = new URL('/api/v1/tasks/cv/batch-extract-async', BACKEND_URL);
    backendUrl.searchParams.set('auto_invite', autoInvite.toString());
    backendUrl.searchParams.set('create_user', createUser.toString());

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
      message: '批量 CV 提取任务已提交（ZIP 已解压），请使用 taskId 轮询结果',
      pollUrl: `/api/tasks/${data.task_id}`,
    });
  } catch (error) {
    console.error('Error in batch-cv-zip route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

