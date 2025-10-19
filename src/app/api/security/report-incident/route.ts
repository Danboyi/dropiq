import { NextRequest, NextResponse } from 'next/server';
import { incidentResponseSystem } from '@/lib/security/incident-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { incidentData } = body;

    if (!incidentData) {
      return NextResponse.json(
        { error: 'Incident data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['incidentType', 'title', 'description', 'reporterId'];
    for (const field of requiredFields) {
      if (!incidentData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate incident type
    const validTypes = ['scam', 'drainer', 'phishing', 'hack', 'vulnerability'];
    if (!validTypes.includes(incidentData.incidentType)) {
      return NextResponse.json(
        { error: 'Invalid incident type' },
        { status: 400 }
      );
    }

    // Create incident report
    const result = await incidentResponseSystem.reportIncident(incidentData);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Incident report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}