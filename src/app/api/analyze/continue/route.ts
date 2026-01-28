import { NextRequest } from 'next/server';
import { ScraperService } from '@/services/scraper.service';
import { AIService } from '@/services/ai.service';
import { ReportService } from '@/services/report.service';
import type { CompetitorAnalysis } from '@/schemas';
import { continueRequestSchema, safeParseJson } from '@/utils/validation';

function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const parseResult = await safeParseJson(request, continueRequestSchema);

  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: parseResult.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { targetUrl, targetProfile, competitors } = parseResult.data;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      };

      const scraper = new ScraperService();
      const ai = new AIService();
      const report = new ReportService();

      try {
        // Step 1: Scrape competitor websites (deduplicate URLs first)
        send('progress', { step: 'scraping_competitors', status: 'in_progress', message: 'Scraping competitor websites' });
        const uniqueUrls = [...new Set(competitors.map((c) => c.url))];
        const competitorContents = await scraper.scrapeMultiple(uniqueUrls);
        send('progress', { step: 'scraping_competitors', status: 'complete', message: `Scraped ${competitorContents.size} websites` });

        // Step 2: Analyze competitors in parallel
        send('progress', { step: 'analyzing', status: 'in_progress', message: 'Analyzing competitors' });
        const analysisPromises = competitors.map(async (competitor) => {
          const content = competitorContents.get(competitor.url);
          if (content) {
            try {
              return await ai.analyzeCompetitor(competitor.url, content);
            } catch {
              return null;
            }
          }
          return null;
        });
        const results = await Promise.all(analysisPromises);
        const competitorAnalyses = results.filter((r): r is CompetitorAnalysis => r !== null);
        send('progress', { step: 'analyzing', status: 'complete', message: `Analyzed ${competitorAnalyses.length} competitors` });

        if (competitorAnalyses.length === 0) {
          send('error', { message: 'Could not analyze any competitors.' });
          controller.close();
          return;
        }

        // Step 3: Generate market analysis and recommendations in parallel
        send('progress', { step: 'market', status: 'in_progress', message: 'Generating analysis' });
        const [marketAnalysis, recommendations] = await Promise.all([
          ai.generateMarketAnalysis(targetProfile, competitorAnalyses),
          ai.generateStrategicRecommendations(targetProfile, competitorAnalyses, {
            marketOverview: '',
            marketSegments: [],
            competitivePositioning: '',
            marketTrends: [],
            entryBarriers: [],
          }),
        ]);
        send('progress', { step: 'market', status: 'complete', message: 'Analysis complete' });

        // Step 4: Generate report
        send('progress', { step: 'report', status: 'in_progress', message: 'Creating report' });
        const reportContent = report.generateReport(
          targetUrl,
          targetProfile,
          competitorAnalyses,
          marketAnalysis,
          recommendations
        );
        send('progress', { step: 'report', status: 'complete', message: 'Report complete' });

        // Send final report
        send('complete', { report: reportContent, companyName: targetProfile.companyName });

      } catch (error) {
        const message = error instanceof Error
          ? `${error.name}: ${error.message}`
          : 'Analysis failed';
        console.error('Continue analysis error:', error);
        send('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
