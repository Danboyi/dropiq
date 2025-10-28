import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      description, 
      category, 
      websiteUrl, 
      twitterUrl, 
      discordUrl, 
      telegramUrl,
      submittedBy,
      submissionNotes 
    } = body;

    // Validation
    if (!name?.trim() || !description?.trim() || !websiteUrl?.trim()) {
      return NextResponse.json(
        { error: 'Name, description, and website URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if airdrop already exists
    const existingAirdrop = await db.airdrop.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: name, mode: 'insensitive' } }
        ]
      }
    });

    if (existingAirdrop) {
      return NextResponse.json(
        { 
          error: 'This airdrop already exists in our database',
          existingAirdrop: {
            id: existingAirdrop.id,
            name: existingAirdrop.name,
            status: existingAirdrop.status
          }
        },
        { status: 409 }
      );
    }

    // Create new airdrop with pending status
    const airdrop = await db.airdrop.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        category: category?.trim() || 'Other',
        websiteUrl: websiteUrl.trim(),
        twitterUrl: twitterUrl?.trim() || null,
        discordUrl: discordUrl?.trim() || null,
        telegramUrl: telegramUrl?.trim() || null,
        status: 'pending', // Requires manual review
        riskScore: 0, // Will be set during review
        hypeScore: 0, // Will be set during review
        notes: `Submitted via promotion form by ${submittedBy || 'anonymous'}. ${submissionNotes || ''}`,
        metadata: {
          submittedVia: 'promotion_form',
          submittedBy: submittedBy || 'anonymous',
          submittedAt: new Date().toISOString(),
          submissionNotes: submissionNotes || ''
        }
      }
    });

    return NextResponse.json({
      success: true,
      airdrop: {
        id: airdrop.id,
        name: airdrop.name,
        slug: airdrop.slug,
        status: airdrop.status,
        message: 'Airdrop submitted successfully! It will be reviewed by our team within 24-48 hours.'
      }
    });

  } catch (error) {
    console.error('Error submitting airdrop:', error);
    return NextResponse.json(
      { error: 'Failed to submit airdrop. Please try again.' },
      { status: 500 }
    );
  }
}