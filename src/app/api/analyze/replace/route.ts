import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import type { BusinessProfile } from '@/schemas';

interface ReplaceRequest {
  targetProfile: BusinessProfile;
  excludeNames: string[];
  count: number;
}

export async function POST(request: NextRequest) {
  const body: ReplaceRequest = await request.json();
  const { targetProfile, excludeNames, count } = body;

  if (!targetProfile || !excludeNames) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const ai = new AIService();

  try {
    // Get more competitors than needed to filter out excluded ones
    const competitors = await ai.inferCompetitors(targetProfile, count + excludeNames.length + 3);

    // Filter out excluded competitors
    const filteredCompetitors = competitors
      .filter((c) => !excludeNames.some((name) =>
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(c.name.toLowerCase())
      ))
      .slice(0, count);

    return NextResponse.json({
      success: true,
      competitors: filteredCompetitors.map((c) => ({
        name: c.name,
        url: c.url,
        description: c.description,
        relevanceScore: c.relevanceScore,
        reasoning: c.reasoning,
        approved: true,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find replacements';
    console.error('Replace competitors error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
