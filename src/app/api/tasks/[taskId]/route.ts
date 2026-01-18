/**
 * API Route: GET /api/tasks/[taskId]
 * 
 * 查询 Celery 异步任务状态
 * 用于轮询后台任务的执行进度
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// 任务状态响应类型
interface TaskStatusResponse {
  task_id: string;
  status: string;
  ready: boolean;
  result?: Record<string, unknown>;
  error?: string;
  progress?: Record<string, unknown>;
}

// 批量任务状态响应类型
interface BatchTaskStatusResponse {
  batch_task_id: string;
  total: number;
  completed: number;
  progress: string;
  ready: boolean;
  results?: Array<{
    task_id: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
  }>;
}

/**
 * GET /api/tasks/[taskId]
 * 查询单个任务状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // 检查是否是批量任务查询
    const searchParams = request.nextUrl.searchParams;
    const isBatch = searchParams.get('batch') === 'true';
    
    // 调用后端 API 查询任务状态
    const endpoint = isBatch 
      ? `${BACKEND_URL}/api/v1/tasks/batch/${taskId}`
      : `${BACKEND_URL}/api/v1/tasks/status/${taskId}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.detail || `Backend returned ${response.status}`,
          taskId,
        },
        { status: response.status }
      );
    }
    
    if (isBatch) {
      const data: BatchTaskStatusResponse = await response.json();
      return NextResponse.json({
        success: true,
        taskId: data.batch_task_id,
        type: 'batch',
        total: data.total,
        completed: data.completed,
        progress: data.progress,
        ready: data.ready,
        results: data.results,
      });
    } else {
      const data: TaskStatusResponse = await response.json();
      return NextResponse.json({
        success: true,
        taskId: data.task_id,
        type: 'single',
        status: data.status,
        ready: data.ready,
        result: data.result,
        error: data.error,
        progress: data.progress,
      });
    }
    
  } catch (error) {
    console.error('Task status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get task status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[taskId]
 * 取消正在执行的任务
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // 调用后端 API 取消任务
    const response = await fetch(`${BACKEND_URL}/api/v1/tasks/cancel/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.detail || `Backend returned ${response.status}`,
          taskId,
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      taskId: data.task_id,
      status: data.status,
      message: 'Task cancelled successfully',
    });
    
  } catch (error) {
    console.error('Task cancel API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
