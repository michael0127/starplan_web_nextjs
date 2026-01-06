/**
 * API Route: POST /api/ranking/job/[jobId]
 * 
 * Triggers AI-powered candidate ranking for a specific job posting.
 * Uses binary insertion with pairwise AI comparisons for optimal ranking.
 * Only candidates who passed hard gate screening will be ranked.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

interface RankedCandidate {
  candidate_id: string;
  rank: number;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface RankingResponse {
  job_posting_id: string;
  job_title: string;
  ranked_candidates: RankedCandidate[];
  total_candidates: number;
  total_comparisons: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
}

interface RankingRequestBody {
  useRawFile?: boolean;
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
    let useRawFile = true; // Default to true (use raw file)
    try {
      const body: RankingRequestBody = await request.json();
      if (typeof body.useRawFile === 'boolean') {
        useRawFile = body.useRawFile;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    // Call FastAPI backend ranking service
    const response = await fetch(`${BACKEND_URL}/api/v1/ranking/rank_job_candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_posting_id: jobId,
        use_raw_file: useRawFile,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Backend returned ${response.status}`;
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const data: RankingResponse = await response.json();
    
    return NextResponse.json({
      success: true,
      data: {
        jobPostingId: data.job_posting_id,
        jobTitle: data.job_title,
        rankedCandidates: data.ranked_candidates.map(c => ({
          candidateId: c.candidate_id,
          rank: c.rank,
          name: c.name,
          email: c.email,
          avatarUrl: c.avatar_url,
        })),
        totalCandidates: data.total_candidates,
        stats: {
          totalComparisons: data.total_comparisons,
          totalTokens: data.total_tokens,
          totalCost: data.total_cost,
          inputTokens: data.total_input_tokens,
          outputTokens: data.total_output_tokens,
          inputCost: data.input_cost,
          outputCost: data.output_cost,
        },
      },
    });
    
  } catch (error) {
    console.error('Ranking API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to rank candidates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check ranking status or get cached results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  return NextResponse.json({
    jobId,
    message: 'Use POST method to trigger candidate ranking',
    endpoint: '/api/ranking/job/[jobId]',
  });
}

