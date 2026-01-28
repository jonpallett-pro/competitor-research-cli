import { z } from 'zod';

// Business Profile Schema
export const BusinessProfileSchema = z.object({
  companyName: z.string(),
  industry: z.string(),
  description: z.string(),
  valueProposition: z.string(),
  targetAudience: z.string(),
  keyFeatures: z.array(z.string()),
  pricingModel: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

// Competitor Schema
export const CompetitorSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  description: z.string(),
  relevanceScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type Competitor = z.infer<typeof CompetitorSchema>;

// Competitor Analysis Schema
export const CompetitorAnalysisSchema = z.object({
  companyName: z.string(),
  url: z.string(),
  overview: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyFeatures: z.array(z.string()),
  pricingModel: z.string(),
  targetMarket: z.string(),
  differentiators: z.array(z.string()),
});

export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

// Market Analysis Schema
export const MarketAnalysisSchema = z.object({
  marketOverview: z.string(),
  marketSegments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    players: z.array(z.string()),
  })),
  competitivePositioning: z.string(),
  marketTrends: z.array(z.string()),
  entryBarriers: z.array(z.string()),
});

export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

// Strategic Recommendations Schema
export const StrategicRecommendationsSchema = z.object({
  summary: z.string(),
  opportunities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  threats: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
  })),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    actionItems: z.array(z.string()),
  })),
});

export type StrategicRecommendations = z.infer<typeof StrategicRecommendationsSchema>;

// CLI Options Schema
export const AnalyzeOptionsSchema = z.object({
  competitors: z.number().min(1).max(10).default(5),
  output: z.string().optional(),
  depth: z.enum(['quick', 'normal', 'deep']).default('normal'),
});

export type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

// Search Result Schema
export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  score: z.number().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Scraped Content Schema
export const ScrapedContentSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  headings: z.array(z.string()),
  paragraphs: z.array(z.string()),
  links: z.array(z.object({
    text: z.string(),
    href: z.string(),
  })),
  rawText: z.string(),
});

export type ScrapedContent = z.infer<typeof ScrapedContentSchema>;
