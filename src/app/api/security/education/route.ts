import { NextRequest, NextResponse } from 'next/server';
import { securityEducationSystem } from '@/lib/security/education-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const contentType = searchParams.get('contentType');
    const featured = searchParams.get('featured') === 'true';

    const filters: any = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (contentType) filters.contentType = contentType;
    if (featured) filters.featured = featured;

    const content = await securityEducationSystem.getEducationContent(filters);

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Education content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}