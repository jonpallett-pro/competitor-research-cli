export const COMPETITOR_ANALYSIS_PROMPT = `Analyze the following competitor website content and create a detailed competitive analysis.

Competitor URL: {{url}}
Website Content:
{{content}}

Create a comprehensive analysis with the following structure. All assessments should be relative to typical target market needs.

{
  "companyName": "Company name",
  "url": "{{url}}",
  "overview": "2-3 sentence overview of the company, their core offering, and market position",
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...],
  "keyFeatures": ["Feature 1", "Feature 2", ...],
  "pricingModel": "Pricing description",
  "targetMarket": "Who they're targeting",
  "differentiators": ["Unique aspect 1", "Unique aspect 2", ...]
}

Guidelines:

STRENGTHS (5-7 items):
- Focus on competitive advantages relative to the target market
- Include product capabilities, market position, brand strength, technology, integrations
- Example: "Strong enterprise security features including SOC 2 compliance and SSO"

WEAKNESSES (5-7 items):
- Identify limitations or gaps relative to market expectations
- Consider pricing, features, scalability, user experience, support
- Be objective - base on content provided, not assumptions
- Example: "Limited mobile app functionality compared to desktop experience"

KEY FEATURES (5-7 items):
- List core product functionality (what the product does)
- Focus on capabilities, not marketing language
- Example: "Real-time collaboration with live cursors and commenting"

DIFFERENTIATORS (3-5 items):
- What makes them UNIQUE compared to alternatives
- These should be distinctive, not just good features
- Example: "AI-powered automation that learns from user behavior"

PRICING MODEL:
- Use one of: "Free", "Freemium (free tier + paid)", "Subscription (monthly/annual)", "Usage-based", "Enterprise/Contact Sales", "One-time purchase"
- Add specifics if available (e.g., "Freemium - Free for up to 5 users, then $10/user/month")
- If not disclosed: "Not publicly disclosed"

TARGET MARKET:
- Be specific about company size, industry, and use case
- Example: "Mid-market B2B SaaS companies with 50-500 employees needing project management"

Return ONLY the JSON object, no additional text.`;

export const MARKET_ANALYSIS_PROMPT = `Based on the target company and competitor analyses provided, create a comprehensive market analysis.

Target Company:
{{targetProfile}}

Competitors:
{{competitorAnalyses}}

Create a market analysis with the following structure:

{
  "marketOverview": "2-3 paragraph overview covering: 1) Market size and growth trajectory, 2) Key players and their positioning, 3) Current competitive dynamics",
  "marketSegments": [
    {
      "name": "Segment name (e.g., 'Enterprise', 'SMB', 'Vertical-specific')",
      "description": "What this segment includes, typical customer profile, and segment-specific needs",
      "players": ["Company 1", "Company 2"]
    }
  ],
  "competitivePositioning": "Analysis of how the target company is positioned relative to competitors - include their strengths, gaps, and market perception",
  "marketTrends": ["Trend 1", "Trend 2", ...],
  "entryBarriers": ["Barrier 1", "Barrier 2", ...]
}

Guidelines:

MARKET SEGMENTS (3-5 segments):
- Identify distinct customer segments in this market
- Consider: company size (Enterprise/SMB/Consumer), industry verticals, use case types
- List which competitors serve each segment

MARKET TRENDS (4-6 trends):
- Focus on trends developing over the past 1-2 years
- Include technology shifts, buyer behavior changes, and competitive dynamics
- Example: "Increasing demand for AI-powered automation to reduce manual workflows"

ENTRY BARRIERS (3-5 barriers):
- What makes it difficult for new entrants
- Consider: technology, brand, network effects, integrations, regulatory

MARKET MATURITY:
- In the marketOverview, indicate whether this is an Emerging (new category), Growth (expanding rapidly), or Mature (established, consolidating) market

Return ONLY the JSON object, no additional text.`;

export const STRATEGIC_RECOMMENDATIONS_PROMPT = `Based on the following competitive analysis, provide strategic recommendations for the target company.

Target Company Profile:
{{targetProfile}}

Competitor Analyses:
{{competitorAnalyses}}

Market Analysis:
{{marketAnalysis}}

Provide strategic recommendations with the following structure:

{
  "summary": "Executive summary of key findings (2-3 paragraphs): 1) Current competitive position, 2) Key opportunities and threats, 3) Strategic priorities",
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Detailed description of the opportunity and why it matters",
      "priority": "high|medium|low"
    }
  ],
  "threats": [
    {
      "title": "Threat title",
      "description": "Detailed description of the threat and potential impact",
      "severity": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation with rationale",
      "priority": "high|medium|low",
      "actionItems": ["Action 1", "Action 2", ...]
    }
  ]
}

Priority/Severity Definitions:

HIGH PRIORITY (Opportunities & Recommendations):
- Critical gap that competitors are exploiting OR major market opportunity
- Timeline: 0-6 months
- Impact: Significant revenue or market share implications

MEDIUM PRIORITY:
- Important for competitive positioning but not urgent
- Timeline: 6-12 months
- Impact: Meaningful improvement in market position

LOW PRIORITY:
- Nice-to-have improvements
- Timeline: 12+ months
- Impact: Incremental benefits

HIGH SEVERITY (Threats):
- Immediate risk to market position or revenue
- Competitors actively gaining advantage here
- Requires defensive action

MEDIUM SEVERITY:
- Growing risk that needs monitoring
- Competitors making progress in this area

LOW SEVERITY:
- Potential future risk
- Early warning sign to track

Guidelines:

OPPORTUNITIES (3-5 items):
- Focus on gaps in competitor offerings the target can exploit
- Consider underserved segments, emerging needs, technology advantages
- Include feasibility considerations

THREATS (3-5 items):
- Identify competitive moves, market shifts, or internal gaps
- Be specific about which competitors pose the threat

RECOMMENDATIONS (4-6 items):
- Each recommendation should have 2-4 specific, actionable items
- Consider resource requirements and feasibility
- Prioritize based on impact vs. effort
- Include both quick wins (high impact, low effort) and strategic initiatives

Return ONLY the JSON object, no additional text.`;
