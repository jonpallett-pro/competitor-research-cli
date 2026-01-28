import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';
import { AIService } from '@/services/ai.service';

interface StartRequest {
  url: string;
  competitors: number;
}

export async function POST(request: NextRequest) {
  const body: StartRequest = await request.json();
  const { url: targetUrl, competitors: maxCompetitors } = body;

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const scraper = new ScraperService();
  const ai = new AIService();

  try {
    // Step 1: Scrape target website
    const targetContent = await scraper.scrape(targetUrl);

    // Step 2: Extract business profile
    const targetProfile = await ai.extractBusinessProfile(targetUrl, targetContent);

    // Step 3: Identify competitors
    const competitors = await ai.inferCompetitors(targetProfile, maxCompetitors);

    return NextResponse.json({
      success: true,
      targetProfile,
      targetContent: {
        url: targetContent.url,
        title: targetContent.title,
        rawText: targetContent.rawText,
      },
      competitors: competitors.map((c) => ({
        name: c.name,
        url: c.url,
        description: c.description,
        relevanceScore: c.relevanceScore,
        reasoning: c.reasoning,
        approved: true, // Default to approved
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('Start analysis error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
