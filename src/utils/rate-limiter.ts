import Bottleneck from 'bottleneck';

// Rate limiter for Anthropic API (adjust based on your tier)
export const anthropicLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500, // 500ms between requests
});

// Rate limiter for Tavily API
export const tavilyLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 200,
});

// Rate limiter for web scraping
export const scrapingLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 1000, // Be polite to websites
});

// Generic wrapper for rate-limited operations
export async function withRateLimit<T>(
  limiter: Bottleneck,
  fn: () => Promise<T>
): Promise<T> {
  return limiter.schedule(fn);
}
