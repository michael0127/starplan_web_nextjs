/**
 * Send Custom Email API
 * POST /api/email/send
 * Sends a custom email to candidates using Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Initialize Resend client lazily to avoid issues if API key is missing
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

interface SendEmailRequest {
  recipientIds: string[];  // Candidate user IDs
  subject: string;
  htmlContent: string;     // Rich text HTML content
  ccEmails?: string[];     // Optional CC emails
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create a Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is an employer
    const employer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true, email: true, name: true },
    });

    if (!employer || employer.userType !== 'EMPLOYER') {
      return NextResponse.json(
        { success: false, error: 'Only employers can send messages' },
        { status: 403 }
      );
    }

    // Get company info
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
      select: { companyName: true, companyLogo: true },
    });

    const body: SendEmailRequest = await request.json();
    const { recipientIds, subject, htmlContent, ccEmails } = body;

    // Validate required fields
    if (!recipientIds || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Validate CC emails format
    const validCcEmails: string[] = [];
    if (ccEmails && ccEmails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of ccEmails) {
        if (email && emailRegex.test(email.trim())) {
          validCcEmails.push(email.trim());
        }
      }
    }

    // Get recipient information
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        userType: 'CANDIDATE',
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid recipients found' },
        { status: 400 }
      );
    }

    // Build email template
    const companyName = company?.companyName || 'StarPlan Employer';
    const senderName = employer.name || employer.email?.split('@')[0] || 'Recruiter';

    // Send emails to each recipient
    const results: Array<{
      email: string;
      name: string | null;
      success: boolean;
      error?: string;
      emailRecordId?: string;
    }> = [];

    for (const recipient of recipients) {
      try {
        const personalizedHtml = buildEmailTemplate({
          recipientName: recipient.name || recipient.email.split('@')[0],
          senderName,
          companyName,
          companyLogo: company?.companyLogo || null,
          htmlContent,
        });

        // Use verified domain email
        const fromEmail = `${companyName} <hello@starplan.ai>`;

        const emailOptions: {
          from: string;
          to: string[];
          subject: string;
          html: string;
          cc?: string[];
          replyTo?: string;
        } = {
          from: fromEmail,
          to: [recipient.email],
          subject: subject,
          html: personalizedHtml,
          replyTo: employer.email || undefined,
        };

        // Add CC if provided
        if (validCcEmails.length > 0) {
          emailOptions.cc = validCcEmails;
        }

        console.log(`Sending email to ${recipient.email}...`);
        const resend = getResendClient();
        const sendResult = await resend.emails.send(emailOptions);
        console.log(`Email sent successfully:`, sendResult);

        // Save email record to database
        const emailRecord = await prisma.emailRecord.create({
          data: {
            senderId: user.id,
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            ccEmails: validCcEmails,
            subject: subject,
            htmlContent: htmlContent,
            status: 'SENT',
            resendId: sendResult.data?.id || null,
          },
        });

        results.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
          emailRecordId: emailRecord.id,
        });
      } catch (emailError: unknown) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        
        // Extract detailed error message
        let errorMessage = 'Unknown error';
        if (emailError instanceof Error) {
          errorMessage = emailError.message;
        } else if (typeof emailError === 'object' && emailError !== null) {
          // Resend API error format
          const resendError = emailError as { message?: string; statusCode?: number };
          errorMessage = resendError.message || JSON.stringify(emailError);
        }

        // Save failed email record
        try {
          await prisma.emailRecord.create({
            data: {
              senderId: user.id,
              recipientId: recipient.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              ccEmails: validCcEmails,
              subject: subject,
              htmlContent: htmlContent,
              status: 'FAILED',
              errorMessage: errorMessage,
            },
          });
        } catch (dbError) {
          console.error('Failed to save email record:', dbError);
        }
        
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        totalSent: successCount,
        totalFailed: failedCount,
        results,
      },
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}

// Build the email HTML template
function buildEmailTemplate({
  recipientName,
  senderName,
  companyName,
  companyLogo,
  htmlContent,
}: {
  recipientName: string;
  senderName: string;
  companyName: string;
  companyLogo: string | null;
  htmlContent: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a5bf4 0%, #3544e4 100%); padding: 32px 40px; text-align: center;">
              ${companyLogo 
                ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 48px; max-width: 200px; margin-bottom: 12px;">`
                : `<h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">${companyName}</h1>`
              }
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">Hello ${recipientName},</p>
              
              <div style="color: #1a1a1a; font-size: 15px; line-height: 1.7; margin: 24px 0;">
                ${htmlContent}
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  Best regards,<br>
                  <strong style="color: #1a1a1a;">${senderName}</strong><br>
                  <span style="color: #999;">${companyName}</span>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                This message was sent via <a href="https://starplan.app" style="color: #4a5bf4; text-decoration: none;">StarPlan</a>
              </p>
              <p style="color: #cccccc; font-size: 11px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} StarPlan. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
