import axios from 'axios';
import type { SearchResult } from '../schemas/index';
import { tavilyLimiter, withRateLimit } from '../utils/rate-limiter';
import logger from '../utils/logger';

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  searchInformation?: {
    totalResults: string;
  };
}

export class SearchService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    if (!searchEngineId) {
      throw new Error('GOOGLE_SEARCH_ENGINE_ID environment variable is required');
    }

    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string, maxResults = 10): Promise<SearchResult[]> {
    return withRateLimit(tavilyLimiter, async () => {
      logger.debug({ query, maxResults }, 'Executing Google Custom Search');

      // Google Custom Search returns max 10 results per request
      const numResults = Math.min(maxResults, 10);

      // Exclude common non-competitor sites
      const excludeSites = '-site:wikipedia.org -site:linkedin.com -site:facebook.com -site:twitter.com -site:youtube.com -site:crunchbase.com';
      const fullQuery = `${query} ${excludeSites}`;

      try {
        const response = await axios.get<GoogleSearchResponse>(this.baseUrl, {
          params: {
            key: this.apiKey,
            cx: this.searchEngineId,
            q: fullQuery,
            num: numResults,
          },
          timeout: 30000,
        });

        const items = response.data.items || [];

        const results: SearchResult[] = items.map((item, index) => ({
          title: item.title,
          url: item.link,
          content: item.snippet || '',
          score: 1 - (index / items.length), // Approximate relevance by position
        }));

        logger.debug({ query, resultCount: results.length }, 'Search complete');
        return results;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          logger.error({ query, status: error.response?.status, message: errorMessage }, 'Google search failed');
          throw new Error(`Search failed: ${errorMessage}`);
        }
        throw error;
      }
    });
  }

  async searchMultiple(queries: string[], maxResultsPerQuery = 5): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();

    const searchPromises = queries.map(async (query) => {
      try {
        const results = await this.search(query, maxResultsPerQuery);
        return results;
      } catch (error) {
        logger.warn({ query, error }, 'Search query failed, skipping');
        return [];
      }
    });

    const resultsArrays = await Promise.all(searchPromises);

    // Deduplicate by URL
    for (const results of resultsArrays) {
      for (const result of results) {
        // Normalize URL for deduplication
        const normalizedUrl = this.normalizeUrl(result.url);
        if (!seenUrls.has(normalizedUrl)) {
          seenUrls.add(normalizedUrl);
          allResults.push(result);
        }
      }
    }

    return allResults;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slashes and common variations
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '').toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }
}

export const createSearchService = () => new SearchService();
