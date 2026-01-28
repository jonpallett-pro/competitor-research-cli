import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedContent } from '../schemas/index';
import { scrapingLimiter, withRateLimit } from '../utils/rate-limiter';
import logger from '../utils/logger';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class ScraperService {
  private timeout: number;

  constructor(timeout = 15000) {
    this.timeout = timeout;
  }

  async scrape(url: string): Promise<ScrapedContent> {
    return withRateLimit(scrapingLimiter, async () => {
      logger.debug({ url }, 'Scraping URL');

      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          maxRedirects: 5,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script, style, and other non-content elements
        $('script, style, noscript, iframe, nav, footer, header').remove();

        // Extract metadata
        const title = $('title').text().trim() ||
                     $('meta[property="og:title"]').attr('content') ||
                     $('h1').first().text().trim() ||
                     'Unknown';

        const description = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content') ||
                           '';

        // Extract headings
        const headings: string[] = [];
        $('h1, h2, h3').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 2 && text.length < 200) {
            headings.push(text);
          }
        });

        // Extract paragraphs
        const paragraphs: string[] = [];
        $('p, li').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 20 && text.length < 2000) {
            paragraphs.push(text);
          }
        });

        // Extract links (limited to avoid noise)
        const links: { text: string; href: string }[] = [];
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && text && text.length > 2 && text.length < 100 && !href.startsWith('#')) {
            // Convert relative URLs to absolute
            try {
              const absoluteUrl = new URL(href, url).href;
              links.push({ text, href: absoluteUrl });
            } catch {
              // Skip invalid URLs
            }
          }
        });

        // Build raw text content (limited for token efficiency)
        const rawText = [
          title,
          description,
          ...headings.slice(0, 20),
          ...paragraphs.slice(0, 50),
        ]
          .filter(Boolean)
          .join('\n\n')
          .slice(0, 15000); // Limit to ~15k chars

        logger.debug({ url, titleLength: title.length, paragraphCount: paragraphs.length }, 'Scraping complete');

        return {
          url,
          title,
          description,
          headings: headings.slice(0, 20),
          paragraphs: paragraphs.slice(0, 50),
          links: links.slice(0, 30),
          rawText,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          logger.error({ url, status: error.response?.status, message: error.message }, 'Scraping failed');
          throw new Error(`Failed to scrape ${url}: ${error.message}`);
        }
        throw error;
      }
    });
  }

  async scrapeMultiple(urls: string[]): Promise<Map<string, ScrapedContent>> {
    const results = new Map<string, ScrapedContent>();

    const scrapePromises = urls.map(async (url) => {
      try {
        const content = await this.scrape(url);
        results.set(url, content);
      } catch (error) {
        logger.warn({ url, error }, 'Failed to scrape URL, skipping');
      }
    });

    await Promise.all(scrapePromises);
    return results;
  }
}

export const scraperService = new ScraperService();
