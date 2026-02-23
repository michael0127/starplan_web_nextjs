/**
 * API Route: POST /api/ranking/job/[jobId]
 * 
 * 使用 Redis + Celery 异步任务接口触发候选人排名
 * 返回任务 ID，前端需要轮询 /api/tasks/[taskId] 获取结果
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// 异步任务提交响应
interface AsyncTaskResponse {
  task_id: string;
  job_posting_id: string;
  status: string;
  message: string;
  query_url: string;
}

interface RankingRequestBody {
  useRawFile?: boolean;
  sync?: boolean;
  skipHardGate?: boolean;
  candidateIds?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body for optional parameters
    let sync = false;
    let skipHardGate = false;
    let candidateIds: string[] | undefined;
    try {
      const body: RankingRequestBody = await request.json();
      if (typeof body.sync === 'boolean') {
        sync = body.sync;
      }
      if (typeof body.skipHardGate === 'boolean') {
        skipHardGate = body.skipHardGate;
      }
      if (Array.isArray(body.candidateIds)) {
        candidateIds = body.candidateIds;
      }
    } catch {
      // No body or invalid JSON, use defaults (async)
    }
    
    const rankingPayload: Record<string, unknown> = {
      job_posting_id: jobId,
      skip_hard_gate: skipHardGate,
    };
    if (candidateIds && candidateIds.length > 0) {
      rankingPayload.candidate_ids = candidateIds;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/tasks/ranking/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rankingPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Backend returned ${response.status}`;
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const data: AsyncTaskResponse = await response.json();
    
    // 如果需要同步等待结果
    if (sync) {
      // 轮询任务状态直到完成（最多等待 5 分钟）
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes
      const pollInterval = 2000; // 2 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        const statusResponse = await fetch(
          `${BACKEND_URL}/api/v1/tasks/status/${data.task_id}`,
          { method: 'GET' }
        );
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          if (statusData.ready) {
            if (statusData.result?.success) {
              // 转换结果格式
              const result = statusData.result;
              return NextResponse.json({
                success: true,
                data: {
                  jobPostingId: result.job_posting_id,
                  jobTitle: result.job_title,
                  rankedCandidates: (result.ranked_candidates || []).map((c: { candidate_id: string; rank: number; name?: string; email?: string; avatar_url?: string }) => ({
                    candidateId: c.candidate_id,
                    rank: c.rank,
                    name: c.name,
                    email: c.email,
                    avatarUrl: c.avatar_url,
                  })),
                  totalCandidates: result.total_candidates,
                  stats: {
                    totalComparisons: result.total_comparisons,
                    totalTokens: result.total_tokens || 0,
                    totalCost: result.total_cost,
                  },
                  cacheStatus: {
                    fromCache: result.from_cache,
                    isIncremental: result.is_incremental,
                    newCandidatesCount: result.new_candidates_count,
                  },
                },
              });
            } else {
              return NextResponse.json(
                { error: statusData.result?.error || 'Ranking task failed' },
                { status: 500 }
              );
            }
          }
        }
        
        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      // 超时
      return NextResponse.json(
        { 
          error: 'Ranking task timeout',
          taskId: data.task_id,
          message: 'Task is still running. Use /api/tasks/[taskId] to check status.',
        },
        { status: 408 }
      );
    }
    
    // 异步模式：立即返回任务 ID
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
    console.error('Ranking API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start ranking task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch existing cached ranking results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }
    
    // Import prisma dynamically to avoid issues
    const { prisma } = await import('@/lib/prisma');
    
    // Fetch existing ranking from database
    const ranking = await prisma.candidateRanking.findUnique({
      where: { jobPostingId: jobId },
      include: {
        jobPosting: {
          select: {
            jobTitle: true,
          },
        },
      },
    });
    
    if (!ranking) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No ranking exists for this job posting',
      });
    }
    
    // Parse ranked candidates from JSON
    const rankedCandidates = typeof ranking.rankedCandidates === 'string' 
      ? JSON.parse(ranking.rankedCandidates) 
      : ranking.rankedCandidates;
    
    return NextResponse.json({
      success: true,
      data: {
        jobPostingId: ranking.jobPostingId,
        jobTitle: ranking.jobPosting.jobTitle,
        rankedCandidates: rankedCandidates.map((c: { candidateId: string; rank: number; name?: string; email?: string; avatar_url?: string }) => ({
          candidateId: c.candidateId,
          rank: c.rank,
          name: c.name || null,
          email: c.email || null,
          avatarUrl: c.avatar_url || null,
        })),
        totalCandidates: ranking.totalCandidates,
        stats: {
          totalComparisons: ranking.totalComparisons,
          totalTokens: ranking.totalTokens,
          totalCost: ranking.totalCost,
          inputTokens: ranking.totalInputTokens,
          outputTokens: ranking.totalOutputTokens,
          inputCost: ranking.inputCost,
          outputCost: ranking.outputCost,
        },
        cacheStatus: {
          fromCache: true,
          isIncremental: false,
          newCandidatesCount: 0,
          cachedAt: ranking.updatedAt.toISOString(),
        },
      },
    });
    
  } catch (error) {
    console.error('Error fetching ranking:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ranking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
