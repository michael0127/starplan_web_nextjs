/**
 * Resume Upload API
 * POST /api/user/resume - 上传用户简历并解析内容到profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // 验证用户身份
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and Word documents are allowed.' },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // 调用CV解析服务（异步处理：提取内容后，后台自动保存profile、创建CV记录并上传文件）
    try {
      const extractionFormData = new FormData();
      extractionFormData.append('file', file);

      const extractionResponse = await fetch(
        `https://starplan-service.onrender.com/api/v1/cv-extraction/extract?user_id=${user.id}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
          },
          body: extractionFormData,
        }
      );

      if (extractionResponse.ok) {
        const result = await extractionResponse.json();
        console.log('CV extraction initiated, processing in background');
        
        return NextResponse.json({
          success: true,
          message: 'CV uploaded successfully. Processing in background.',
          extraction: {
            success: true,
            data: result,
          },
        });
      } else {
        const errorText = await extractionResponse.text();
        console.error('CV extraction error:', errorText);
        return NextResponse.json(
          { error: 'Failed to process CV file' },
          { status: 500 }
        );
      }
    } catch (extractionError) {
      console.error('CV extraction request failed:', extractionError);
      return NextResponse.json(
        { error: 'Failed to process CV file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resume upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


