import Anthropic from '@anthropic-ai/sdk';
import type {
  BusinessProfile,
  Competitor,
  CompetitorAnalysis,
  MarketAnalysis,
  StrategicRecommendations,
  ScrapedContent,
  SearchResult,
} from '../schemas/index';
import {
  BusinessProfileSchema,
  CompetitorAnalysisSchema,
  MarketAnalysisSchema,
  StrategicRecommendationsSchema,
} from '../schemas/index';
import {
  BUSINESS_PROFILE_PROMPT,
  SEARCH_QUERIES_PROMPT,
  FILTER_COMPETITORS_PROMPT,
  INFER_COMPETITORS_PROMPT,
} from '../prompts/business-analysis';
import {
  COMPETITOR_ANALYSIS_PROMPT,
  MARKET_ANALYSIS_PROMPT,
  STRATEGIC_RECOMMENDATIONS_PROMPT,
} from '../prompts/competitor-analysis';
import { anthropicLimiter, withRateLimit } from '../utils/rate-limiter';
import logger from '../utils/logger';
import { z } from 'zod';

export class AIService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic();
  }

  private async complete(prompt: string, maxTokens = 4096): Promise<string> {
    return withRateLimit(anthropicLimiter, async () => {
      logger.debug({ promptLength: prompt.length }, 'Sending AI request');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from AI');
      }

      logger.debug({ responseLength: textContent.text.length }, 'AI response received');
      return textContent.text;
    });
  }

  private parseJSON<T>(text: string, schema: z.ZodSchema<T>): T {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const jsonStr = jsonMatch[1]?.trim() || text.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed);
    } catch (error) {
      logger.error({ text: jsonStr.slice(0, 500), error }, 'Failed to parse AI response');
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  private fillTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  async extractBusinessProfile(url: string, content: ScrapedContent): Promise<BusinessProfile> {
    const prompt = this.fillTemplate(BUSINESS_PROFILE_PROMPT, {
      url,
      content: content.rawText,
    });

    const response = await this.complete(prompt);
    return this.parseJSON(response, BusinessProfileSchema);
  }

  async generateSearchQueries(profile: BusinessProfile): Promise<string[]> {
    const prompt = this.fillTemplate(SEARCH_QUERIES_PROMPT, {
      companyName: profile.companyName,
      industry: profile.industry,
      description: profile.description,
      valueProposition: profile.valueProposition,
      targetAudience: profile.targetAudience,
      keyFeatures: profile.keyFeatures.join(', '),
    });

    const response = await this.complete(prompt, 1024);
    return this.parseJSON(response, z.array(z.string()));
  }

  async filterCompetitors(
    profile: BusinessProfile,
    searchResults: SearchResult[],
    maxCompetitors: number
  ): Promise<Competitor[]> {
    const searchResultsText = searchResults
      .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.content}`)
      .join('\n\n');

    const prompt = this.fillTemplate(FILTER_COMPETITORS_PROMPT, {
      companyName: profile.companyName,
      industry: profile.industry,
      description: profile.description,
      valueProposition: profile.valueProposition,
      searchResults: searchResultsText,
      maxCompetitors: maxCompetitors.toString(),
    });

    const response = await this.complete(prompt);
    const competitors = this.parseJSON(response, z.array(z.object({
      name: z.string(),
      url: z.string(),
      description: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
    })));

    // Filter out the target company's own domain
    const targetDomain = new URL(profile.companyName.includes('.') ? `https://${profile.companyName}` : 'https://example.com').hostname;

    return competitors
      .filter((c) => {
        try {
          const competitorDomain = new URL(c.url).hostname;
          return !competitorDomain.includes(targetDomain) && !targetDomain.includes(competitorDomain);
        } catch {
          return true;
        }
      })
      .slice(0, maxCompetitors);
  }

  async inferCompetitors(
    profile: BusinessProfile,
    maxCompetitors: number
  ): Promise<Competitor[]> {
    const prompt = this.fillTemplate(INFER_COMPETITORS_PROMPT, {
      companyName: profile.companyName,
      industry: profile.industry,
      description: profile.description,
      valueProposition: profile.valueProposition,
      targetAudience: profile.targetAudience,
      keyFeatures: profile.keyFeatures.join(', '),
      maxCompetitors: maxCompetitors.toString(),
    });

    const response = await this.complete(prompt);
    const competitors = this.parseJSON(response, z.array(z.object({
      name: z.string(),
      url: z.string(),
      description: z.string(),
      relevanceScore: z.number(),
      reasoning: z.string(),
    })));

    // Filter out invalid URLs and the target company
    return competitors
      .filter((c) => {
        try {
          new URL(c.url); // Validate URL
          const competitorDomain = new URL(c.url).hostname.toLowerCase();
          const targetName = profile.companyName.toLowerCase().replace(/\s+/g, '');
          return !competitorDomain.includes(targetName);
        } catch {
          return false;
        }
      })
      .slice(0, maxCompetitors);
  }

  async analyzeCompetitor(url: string, content: ScrapedContent): Promise<CompetitorAnalysis> {
    const prompt = this.fillTemplate(COMPETITOR_ANALYSIS_PROMPT, {
      url,
      content: content.rawText,
    });

    const response = await this.complete(prompt);
    return this.parseJSON(response, CompetitorAnalysisSchema);
  }

  async generateMarketAnalysis(
    targetProfile: BusinessProfile,
    competitorAnalyses: CompetitorAnalysis[]
  ): Promise<MarketAnalysis> {
    const prompt = this.fillTemplate(MARKET_ANALYSIS_PROMPT, {
      targetProfile: JSON.stringify(targetProfile, null, 2),
      competitorAnalyses: JSON.stringify(competitorAnalyses, null, 2),
    });

    const response = await this.complete(prompt);
    return this.parseJSON(response, MarketAnalysisSchema);
  }

  async generateStrategicRecommendations(
    targetProfile: BusinessProfile,
    competitorAnalyses: CompetitorAnalysis[],
    marketAnalysis: MarketAnalysis
  ): Promise<StrategicRecommendations> {
    const prompt = this.fillTemplate(STRATEGIC_RECOMMENDATIONS_PROMPT, {
      targetProfile: JSON.stringify(targetProfile, null, 2),
      competitorAnalyses: JSON.stringify(competitorAnalyses, null, 2),
      marketAnalysis: JSON.stringify(marketAnalysis, null, 2),
    });

    const response = await this.complete(prompt);
    return this.parseJSON(response, StrategicRecommendationsSchema);
  }
}

export const aiService = new AIService();
