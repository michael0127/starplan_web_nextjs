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

    // 1. 上传文件到存储服务
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('bucket_name', 'cvs');
    uploadFormData.append('folder_path', user.id); // 使用用户ID作为文件夹名

    const uploadResponse = await fetch('https://starplan-service.onrender.com/api/v1/storage/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Storage upload error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    const uploadResult = await uploadResponse.json();
    const fileUrl = uploadResult.url || uploadResult.file_url || uploadResult.path;

    // 2. 调用CV解析服务（这会自动保存profile数据到数据库）
    let extractedData = null;
    let cvExtractionSuccess = false;

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
        extractedData = await extractionResponse.json();
        cvExtractionSuccess = true;
        console.log('CV extraction successful:', extractedData);
      } else {
        const errorText = await extractionResponse.text();
        console.error('CV extraction error:', errorText);
        // 不阻止流程，继续保存CV记录
      }
    } catch (extractionError) {
      console.error('CV extraction request failed:', extractionError);
      // 不阻断流程，继续保存CV记录
    }

    // 3. 保存CV记录到数据库
    const cv = await prisma.cV.create({
      data: {
        userId: user.id,
        fileUrl: fileUrl,
        extractedData: extractedData ? (extractedData as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return NextResponse.json({
      success: true,
      cv: {
        id: cv.id,
        fileUrl: cv.fileUrl,
        createdAt: cv.createdAt,
      },
      extraction: {
        success: cvExtractionSuccess,
        data: extractedData,
        message: cvExtractionSuccess 
          ? 'CV parsed and profile updated successfully' 
          : 'CV uploaded but parsing failed - you can retry later',
      },
    });
  } catch (error) {
    console.error('Resume upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


