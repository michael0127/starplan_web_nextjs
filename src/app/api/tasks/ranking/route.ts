/**
 * API Route: POST /api/tasks/ranking
 * 
 * 使用 Redis + Celery 异步任务接口执行候选人排名任务
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// 请求体类型
interface RankingRequestBody {
  jobPostingId: string;
}

// 异步任务响应类型
interface AsyncTaskResponse {
  task_id: string;
  job_posting_id: string;
  status: string;
  message: string;
  query_url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RankingRequestBody = await request.json();
    
    if (!body.jobPostingId) {
      return NextResponse.json(
        { error: 'jobPostingId is required' },
        { status: 400 }
      );
    }
    
    // 调用后端异步任务接口
    const response = await fetch(`${BACKEND_URL}/api/v1/tasks/ranking/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_posting_id: body.jobPostingId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data: AsyncTaskResponse = await response.json();
    
    return NextResponse.json({
      success: true,
      async: true,
      taskId: data.task_id,
      jobPostingId: data.job_posting_id,
      status: data.status,
      message: '排名任务已提交，请使用 taskId 轮询结果',
      pollUrl: `/api/tasks/${data.task_id}`,
    });
    
  } catch (error) {
    console.error('Ranking task API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start ranking task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
