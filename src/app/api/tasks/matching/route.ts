/**
 * API Route: POST /api/tasks/matching
 * 
 * 使用 Redis + Celery 异步任务接口执行匹配任务
 * 支持多种匹配模式：
 * - candidate-to-job: 单个候选人匹配单个职位
 * - candidate-to-all-jobs: 单个候选人匹配所有职位
 * - job-to-all-candidates: 单个职位匹配所有候选人
 * - batch: 批量匹配
 * - full: 全量匹配
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// 请求体类型
interface MatchingRequestBody {
  type: 'candidate-to-job' | 'candidate-to-all-jobs' | 'job-to-all-candidates' | 'batch' | 'full';
  candidateId?: string;
  jobPostingId?: string;
  cvId?: string;
  skipHardGate?: boolean;
  pairs?: Array<{
    candidateId: string;
    jobPostingId: string;
    cvId?: string;
  }>;
}

// 异步任务响应类型
interface AsyncTaskResponse {
  task_id: string;
  status: string;
  message: string;
  query_url: string;
  candidate_id?: string;
  job_posting_id?: string;
  total_pairs?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MatchingRequestBody = await request.json();
    
    if (!body.type) {
      return NextResponse.json(
        { error: 'Match type is required' },
        { status: 400 }
      );
    }
    
    let endpoint: string;
    let requestBody: Record<string, unknown>;
    
    switch (body.type) {
      case 'candidate-to-job':
        if (!body.candidateId || !body.jobPostingId) {
          return NextResponse.json(
            { error: 'candidateId and jobPostingId are required for candidate-to-job matching' },
            { status: 400 }
          );
        }
        endpoint = '/api/v1/tasks/matching/candidate-to-job';
        requestBody = {
          candidate_id: body.candidateId,
          job_posting_id: body.jobPostingId,
          cv_id: body.cvId || null,
          skip_hard_gate: body.skipHardGate || false,
        };
        break;
        
      case 'candidate-to-all-jobs':
        if (!body.candidateId) {
          return NextResponse.json(
            { error: 'candidateId is required for candidate-to-all-jobs matching' },
            { status: 400 }
          );
        }
        endpoint = '/api/v1/tasks/matching/candidate-to-all-jobs';
        requestBody = {
          candidate_id: body.candidateId,
          cv_id: body.cvId || null,
          skip_hard_gate: body.skipHardGate || false,
        };
        break;
        
      case 'job-to-all-candidates':
        if (!body.jobPostingId) {
          return NextResponse.json(
            { error: 'jobPostingId is required for job-to-all-candidates matching' },
            { status: 400 }
          );
        }
        endpoint = '/api/v1/tasks/matching/job-to-all-candidates';
        requestBody = {
          job_posting_id: body.jobPostingId,
          skip_hard_gate: body.skipHardGate || false,
        };
        break;
        
      case 'batch':
        if (!body.pairs || body.pairs.length === 0) {
          return NextResponse.json(
            { error: 'pairs array is required for batch matching' },
            { status: 400 }
          );
        }
        endpoint = '/api/v1/tasks/matching/batch';
        requestBody = {
          pairs: body.pairs.map(p => ({
            candidate_id: p.candidateId,
            job_posting_id: p.jobPostingId,
            cv_id: p.cvId || null,
          })),
          skip_hard_gate: body.skipHardGate || false,
        };
        break;
        
      case 'full':
        endpoint = '/api/v1/tasks/matching/full';
        requestBody = {
          skip_hard_gate: body.skipHardGate || false,
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown match type: ${body.type}` },
          { status: 400 }
        );
    }
    
    // 调用后端异步任务接口
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
      type: body.type,
      status: data.status,
      message: data.message,
      pollUrl: `/api/tasks/${data.task_id}`,
      // 额外信息
      candidateId: data.candidate_id,
      jobPostingId: data.job_posting_id,
      totalPairs: data.total_pairs,
    });
    
  } catch (error) {
    console.error('Matching task API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start matching task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
