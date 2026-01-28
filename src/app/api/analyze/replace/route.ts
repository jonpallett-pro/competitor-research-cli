import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { replaceRequestSchema, safeParseJson } from '@/utils/validation';

export async function POST(request: NextRequest) {
  const parseResult = await safeParseJson(request, replaceRequestSchema);

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 });
  }

  const { targetProfile, excludeNames, count } = parseResult.data;

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

    if (filteredCompetitors.length === 0) {
      return NextResponse.json(
        { error: 'Could not find any replacement competitors. Try with different criteria.' },
        { status: 404 }
      );
    }

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
