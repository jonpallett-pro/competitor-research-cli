export const BUSINESS_PROFILE_PROMPT = `Analyze the following website content and extract a comprehensive business profile.

Website URL: {{url}}
Website Content:
{{content}}

Extract and return the following information in JSON format:
{
  "companyName": "The company name",
  "industry": "The primary industry/sector",
  "description": "A 2-3 sentence description of what the company does",
  "valueProposition": "The main value proposition or unique selling point",
  "targetAudience": "Who the product/service is for",
  "keyFeatures": ["Feature 1", "Feature 2", ...],
  "pricingModel": "Description of pricing approach if available",
  "techStack": ["Technology 1", "Technology 2", ...] // if identifiable
}

Be concise but comprehensive. If information is not available, make reasonable inferences based on the content or omit optional fields.

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
- relevanceScore: 0-100 score of how directly competitive they are
- reasoning: Why they are a competitor

IMPORTANT:
- Exclude the target company itself
- Exclude generic sites (Wikipedia, LinkedIn company pages, news articles, review sites)
- Focus on companies offering similar products/services to similar audiences
- Prioritize direct competitors over tangential ones

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
- description: Brief description of what they do
- relevanceScore: 0-100 score of how directly competitive they are
- reasoning: Why they are a competitor

IMPORTANT:
- Only include REAL companies with working websites
- Use accurate, up-to-date URLs (main domain only, e.g., https://asana.com not https://asana.com/product)
- Focus on well-known, established competitors
- Prioritize direct competitors over tangential ones
- Exclude the target company itself

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
