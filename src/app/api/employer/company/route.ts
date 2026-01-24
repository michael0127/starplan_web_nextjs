/**
 * Company Settings API
 * GET /api/employer/company - Get company settings
 * PUT /api/employer/company - Update company settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// GET - Retrieve company settings
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with company
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (dbUser.userType !== 'EMPLOYER') {
      return NextResponse.json(
        { error: 'Only employers can access company settings' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dbUser.company || null
    });

  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

// PUT - Update company settings
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is employer
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (dbUser.userType !== 'EMPLOYER') {
      return NextResponse.json(
        { error: 'Only employers can update company settings' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      companyName,
      companyLogo,
      companyCoverImage,
      videoLink,
      website,
      industry,
      companySize,
      description,
      location,
      foundedYear,
      linkedinUrl,
      twitterUrl,
      // Billing fields
      billingAddress,
      billingEmail,
      billingEmailSameAsRegistration,
      abn
    } = body;

    // Validate required fields
    if (!companyName || companyName.trim() === '') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Validate video link if provided
    if (videoLink && videoLink.trim() !== '') {
      const videoUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|wistia\.com)/i;
      if (!videoUrlPattern.test(videoLink)) {
        return NextResponse.json(
          { error: 'Invalid video link. Please provide a YouTube, Vimeo, or Wistia URL' },
          { status: 400 }
        );
      }
    }

    // Upsert company (create if not exists, update if exists)
    const company = await prisma.company.upsert({
      where: { userId: user.id },
      update: {
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        companyCoverImage: companyCoverImage || null,
        videoLink: videoLink?.trim() || null,
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        companySize: companySize || null,
        description: description?.trim() || null,
        location: location?.trim() || null,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        linkedinUrl: linkedinUrl?.trim() || null,
        twitterUrl: twitterUrl?.trim() || null,
        // Billing fields
        billingAddress: billingAddress?.trim() || null,
        billingEmail: billingEmailSameAsRegistration ? null : (billingEmail?.trim() || null),
        billingEmailSameAsRegistration: billingEmailSameAsRegistration ?? true,
        abn: abn?.trim() || null
      },
      create: {
        userId: user.id,
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        companyCoverImage: companyCoverImage || null,
        videoLink: videoLink?.trim() || null,
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        companySize: companySize || null,
        description: description?.trim() || null,
        location: location?.trim() || null,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        linkedinUrl: linkedinUrl?.trim() || null,
        twitterUrl: twitterUrl?.trim() || null,
        // Billing fields
        billingAddress: billingAddress?.trim() || null,
        billingEmail: billingEmailSameAsRegistration ? null : (billingEmail?.trim() || null),
        billingEmailSameAsRegistration: billingEmailSameAsRegistration ?? true,
        abn: abn?.trim() || null
      }
    });

    // Sync company logo, cover image, and video link to all job postings
    const updateResult = await prisma.jobPosting.updateMany({
      where: { userId: user.id },
      data: {
        companyName: companyName.trim(),
        companyLogo: companyLogo || null,
        companyCoverImage: companyCoverImage || null,
        videoLink: videoLink?.trim() || null
      }
    });

    return NextResponse.json({
      success: true,
      data: company,
      syncedJobPostings: updateResult.count
    });

  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}


