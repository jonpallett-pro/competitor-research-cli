export const BUSINESS_PROFILE_PROMPT = `Analyze the following website content and extract a comprehensive business profile.

This profile will be used for competitive analysis to identify and evaluate competitors in the same market.

Website URL: {{url}}
Website Content:
{{content}}

Extract and return the following information in JSON format:
{
  "companyName": "The official company or product name",
  "industry": "The primary industry/sector (e.g., 'Project Management Software', 'E-commerce Platform', 'B2B SaaS')",
  "description": "A 2-3 sentence description of what the company does and their core offering",
  "valueProposition": "The main value proposition or unique selling point that differentiates them",
  "targetAudience": "Who the product/service is for (e.g., 'Small to medium businesses', 'Enterprise teams', 'Individual developers')",
  "keyFeatures": ["Feature 1", "Feature 2", ...], // List 5-8 core features
  "pricingModel": "Description of pricing approach. Use 'Free', 'Freemium', 'Subscription', 'Usage-based', 'Enterprise/Contact Sales', or 'Not publicly disclosed' if not available",
  "techStack": ["Technology 1", "Technology 2", ...] // Technologies mentioned or identifiable, omit if unknown
}

Guidelines:
- Be concise but comprehensive
- For pricingModel: If no pricing information is found, use "Not publicly disclosed"
- For keyFeatures: Focus on product capabilities, not marketing claims
- For techStack: Only include if explicitly mentioned or clearly identifiable; omit the field entirely if unknown

Return ONLY the JSON object, no additional text.`;

export const SEARCH_QUERIES_PROMPT = `Based on the following business profile, generate search queries to find competitors.

Business Profile:
- Company: {{companyName}}
- Industry: {{industry}}
- Description: {{description}}
- Value Proposition: {{valueProposition}}
- Target Audience: {{targetAudience}}
- Key Features: {{keyFeatures}}

Generate 5 search queries that would help identify direct competitors. Focus on:
1. Industry + product type searches
2. Alternative/competitor searches
3. Feature-based searches
4. Target audience + solution searches
5. Problem-solution searches

Return as a JSON array of strings:
["query 1", "query 2", "query 3", "query 4", "query 5"]

Return ONLY the JSON array, no additional text.`;

export const FILTER_COMPETITORS_PROMPT = `Analyze the following search results and identify the most relevant competitors for the target company.

Target Company:
- Name: {{companyName}}
- Industry: {{industry}}
- Description: {{description}}
- Value Proposition: {{valueProposition}}

Search Results:
{{searchResults}}

Identify up to {{maxCompetitors}} direct or close competitors. For each competitor, provide:
- name: Company name
- url: Website URL (main domain only, e.g., https://example.com)
- description: Brief description of what they do
- relevanceScore: 60-100 score (see scoring guide below)
- reasoning: Why they are a competitor

Relevance Score Guide:
- 85-100: Direct competitor - Same market, similar features, targets same audience
- 70-84: Strong overlap - Significant feature or audience overlap, clearly competes for same customers
- 60-69: Partial overlap - Some feature/audience overlap, alternative in certain use cases
- Below 60: Do not include - Too tangential to be a meaningful competitor

IMPORTANT:
- Exclude the target company itself
- Exclude generic sites (Wikipedia, LinkedIn company pages, news articles, review sites like G2/Capterra)
- Focus on companies offering similar products/services to similar audiences
- Prioritize direct competitors over tangential ones
- All competitors must score 60 or above

Return as a JSON array:
[
  {
    "name": "Competitor Name",
    "url": "https://competitor.com",
    "description": "What they do",
    "relevanceScore": 85,
    "reasoning": "Why they compete"
  }
]

Return ONLY the JSON array, no additional text.`;

export const INFER_COMPETITORS_PROMPT = `Based on the following business profile, identify the most likely direct competitors in the market.

Note: My knowledge has a cutoff date, so some information may be outdated. I will focus on well-established competitors that are likely still active.

Target Company:
- Name: {{companyName}}
- Industry: {{industry}}
- Description: {{description}}
- Value Proposition: {{valueProposition}}
- Target Audience: {{targetAudience}}
- Key Features: {{keyFeatures}}

Using your knowledge, identify up to {{maxCompetitors}} direct competitors that:
1. Operate in the same industry/market
2. Target similar customers
3. Offer similar products or services
4. Would be considered alternatives by potential customers

For each competitor, provide:
- name: Company name
- url: Their main website URL (must be a real, valid URL like https://company.com)
- description: Brief description of what they do (1-2 sentences)
- relevanceScore: 60-100 score based on the scale below
- reasoning: Why they are a competitor (1-2 sentences)

Relevance Score Scale:
- 85-100: Direct competitor - Same market, similar features, targets same audience
  Example: Asana vs Monday.com (both project management for teams)
- 70-84: Strong overlap - Significant feature or audience overlap
  Example: Slack vs Microsoft Teams (both team communication, different ecosystems)
- 60-69: Partial overlap - Some feature/audience overlap, alternative in certain cases
  Example: Notion vs Google Docs (both document editing, different scope)
- Below 60: Do not include - Too tangential

IMPORTANT:
- Only include REAL companies with working websites
- Use accurate, up-to-date URLs (main domain only, e.g., https://asana.com not https://asana.com/product)
- Focus on well-known, established competitors
- Prioritize direct competitors (85+) over partial overlaps
- Exclude the target company itself
- All competitors must score 60 or above

Example output format:
[
  {
    "name": "Competitor Name",
    "url": "https://competitor.com",
    "description": "A project management platform for teams with kanban boards and timeline views.",
    "relevanceScore": 92,
    "reasoning": "Direct competitor targeting the same SMB market with similar feature set and pricing."
  }
]

Return ONLY the JSON array, no additional text.`;
