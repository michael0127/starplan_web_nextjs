/**
 * API Route: POST /api/admin/create-job-from-jd
 * 
 * Admin 功能：通过上传 JD 文件为指定用户创建 Job Posting
 * 使用后端 /api/v1/jd/analyze 接口（同步），因为是单个文件
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface JDAnalyzeResponse {
  data: Record<string, unknown>;
  job_posting_id: string;
  file_url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const status = formData.get('status') as string | null; // DRAFT or PUBLISHED

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    // Create FormData for backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('save_to_db', 'true');
    backendFormData.append('user_id', userId);

    // Call backend JD analyze endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/jd/analyze`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data: JDAnalyzeResponse = await response.json();

    return NextResponse.json({
      success: true,
      jobPostingId: data.job_posting_id,
      fileUrl: data.file_url,
      extractedData: data.data,
      message: 'Job posting created successfully from JD',
    });
  } catch (error) {
    console.error('Error creating job from JD:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
