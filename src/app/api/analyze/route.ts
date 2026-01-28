import { NextRequest } from 'next/server';
import { ScraperService } from '@/services/scraper.service';
import { AIService } from '@/services/ai.service';
import { ReportService } from '@/services/report.service';
import type { CompetitorAnalysis } from '@/schemas';

interface AnalyzeRequest {
  url: string;
  competitors: number;
}

// Helper to create SSE message
function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const body: AnalyzeRequest = await request.json();
  const { url: targetUrl, competitors: maxCompetitors } = body;

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
        // Step 1: Scrape target website
        send('progress', { step: 'scraping', status: 'in_progress', message: 'Analyzing target website' });
        const targetContent = await scraper.scrape(targetUrl);
        send('progress', { step: 'scraping', status: 'complete', message: `Scraped: ${targetContent.title}` });

        // Step 2: Extract business profile
        send('progress', { step: 'profile', status: 'in_progress', message: 'Extracting business profile' });
        const targetProfile = await ai.extractBusinessProfile(targetUrl, targetContent);
        send('progress', { step: 'profile', status: 'complete', message: `Identified: ${targetProfile.companyName}` });
        send('profile', { companyName: targetProfile.companyName, industry: targetProfile.industry });

        // Step 3: Identify competitors
        send('progress', { step: 'identifying', status: 'in_progress', message: 'Identifying competitors' });
        const competitors = await ai.inferCompetitors(targetProfile, maxCompetitors);
        send('progress', { step: 'identifying', status: 'complete', message: `Found ${competitors.length} competitors` });

        if (competitors.length === 0) {
          send('error', { message: 'No competitors found. Try a different URL.' });
          controller.close();
          return;
        }

        // Send competitors list
        send('competitors', competitors.map((c) => ({ name: c.name, relevance: c.relevanceScore })));

        // Step 4: Scrape competitor websites
        send('progress', { step: 'scraping_competitors', status: 'in_progress', message: 'Scraping competitor websites' });
        const competitorUrls = competitors.map((c) => c.url);
        const competitorContents = await scraper.scrapeMultiple(competitorUrls);
        send('progress', { step: 'scraping_competitors', status: 'complete', message: `Scraped ${competitorContents.size} websites` });

        // Step 5: Analyze competitors
        send('progress', { step: 'analyzing', status: 'in_progress', message: 'Analyzing competitors' });
        const competitorAnalyses: CompetitorAnalysis[] = [];

        for (const competitor of competitors) {
          const content = competitorContents.get(competitor.url);
          if (content) {
            try {
              const analysis = await ai.analyzeCompetitor(competitor.url, content);
              competitorAnalyses.push(analysis);
              send('progress', { step: 'analyzing', status: 'in_progress', message: `Analyzed ${competitorAnalyses.length}/${competitors.length}` });
            } catch {
              // Skip failed analyses
            }
          }
        }
        send('progress', { step: 'analyzing', status: 'complete', message: `Analyzed ${competitorAnalyses.length} competitors` });

        if (competitorAnalyses.length === 0) {
          send('error', { message: 'Could not analyze any competitors.' });
          controller.close();
          return;
        }

        // Step 6: Generate market analysis
        send('progress', { step: 'market', status: 'in_progress', message: 'Generating market analysis' });
        const marketAnalysis = await ai.generateMarketAnalysis(targetProfile, competitorAnalyses);
        send('progress', { step: 'market', status: 'complete', message: 'Market analysis complete' });

        // Step 7: Generate strategic recommendations
        send('progress', { step: 'recommendations', status: 'in_progress', message: 'Generating recommendations' });
        const recommendations = await ai.generateStrategicRecommendations(
          targetProfile,
          competitorAnalyses,
          marketAnalysis
        );
        send('progress', { step: 'recommendations', status: 'complete', message: 'Recommendations complete' });

        // Step 8: Generate report
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
        const message = error instanceof Error ? error.message : 'Analysis failed';
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
