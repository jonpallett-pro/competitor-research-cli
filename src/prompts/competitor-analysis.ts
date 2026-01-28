export const COMPETITOR_ANALYSIS_PROMPT = `Analyze the following competitor website content and create a detailed competitive analysis.

Competitor URL: {{url}}
Website Content:
{{content}}

Create a comprehensive analysis including:
{
  "companyName": "Company name",
  "url": "{{url}}",
  "overview": "2-3 sentence overview of the company",
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...],
  "keyFeatures": ["Feature 1", "Feature 2", ...],
  "pricingModel": "Description of pricing (free, freemium, subscription, enterprise, etc.)",
  "targetMarket": "Who they're targeting",
  "differentiators": ["What makes them unique 1", "What makes them unique 2", ...]
}

Be objective and base analysis on the content provided. If certain information isn't available, make reasonable inferences or note limitations.

Return ONLY the JSON object, no additional text.`;

export const MARKET_ANALYSIS_PROMPT = `Based on the target company and competitor analyses provided, create a comprehensive market analysis.

Target Company:
{{targetProfile}}

Competitors:
{{competitorAnalyses}}

Create a market analysis including:
{
  "marketOverview": "2-3 paragraph overview of the market landscape",
  "marketSegments": [
    {
      "name": "Segment name",
      "description": "What this segment includes",
      "players": ["Company 1", "Company 2"]
    }
  ],
  "competitivePositioning": "Analysis of how the target company is positioned relative to competitors",
  "marketTrends": ["Trend 1", "Trend 2", ...],
  "entryBarriers": ["Barrier 1", "Barrier 2", ...]
}

Be analytical and strategic. Identify patterns across competitors.

Return ONLY the JSON object, no additional text.`;

export const STRATEGIC_RECOMMENDATIONS_PROMPT = `Based on the following competitive analysis, provide strategic recommendations for the target company.

Target Company Profile:
{{targetProfile}}

Competitor Analyses:
{{competitorAnalyses}}

Market Analysis:
{{marketAnalysis}}

Provide strategic recommendations:
{
  "summary": "Executive summary of key findings (2-3 paragraphs)",
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Detailed description",
      "priority": "high|medium|low"
    }
  ],
  "threats": [
    {
      "title": "Threat title",
      "description": "Detailed description",
      "severity": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "actionItems": ["Action 1", "Action 2", ...]
    }
  ]
}

Be specific, actionable, and strategic. Prioritize recommendations by potential impact.

Return ONLY the JSON object, no additional text.`;
