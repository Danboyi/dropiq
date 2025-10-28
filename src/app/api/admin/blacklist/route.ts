import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/authenticateToken';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request - only admins can access
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') as 'domain' | 'contract_address' | null;
    const source = searchParams.get('source');

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (source) where.source = source;

    // Get pagination info
    const skip = (page - 1) * limit;

    // Fetch blacklist entries
    const [entries, total] = await Promise.all([
      db.blacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.blacklist.count({ where })
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Blacklist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklist entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request - only admins can add entries
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, value, source } = body;

    // Validate input
    if (!type || !value || !source) {
      return NextResponse.json(
        { error: 'Type, value, and source are required' },
        { status: 400 }
      );
    }

    if (!['domain', 'contract_address'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be domain or contract_address' },
        { status: 400 }
      );
    }

    // Validate value format
    if (type === 'domain') {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
      if (!domainRegex.test(value.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid domain format' },
          { status: 400 }
        );
      }
    } else if (type === 'contract_address') {
      // Basic Ethereum address validation
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(value.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid contract address format' },
          { status: 400 }
        );
      }
    }

    // Check if entry already exists
    const existingEntry = await db.blacklist.findFirst({
      where: {
        type,
        value: value.toLowerCase()
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Entry already exists in blacklist' },
        { status: 409 }
      );
    }

    // Create new blacklist entry
    const newEntry = await db.blacklist.create({
      data: {
        type,
        value: value.toLowerCase(),
        source
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Blacklist entry added successfully',
      entry: newEntry
    });

  } catch (error) {
    console.error('Blacklist add error:', error);
    return NextResponse.json(
      { error: 'Failed to add blacklist entry' },
      { status: 500 }
    );
  }
}