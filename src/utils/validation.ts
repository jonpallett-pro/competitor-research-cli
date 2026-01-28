import { z } from 'zod';

/**
 * Check if a URL points to a private/internal network address
 */
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0'
    ) {
      return true;
    }

    // Block local domains
    if (
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return true;
    }

    // Block private IP ranges
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      // 10.x.x.x
      if (a === 10) return true;
      // 172.16.x.x - 172.31.x.x
      if (a === 172 && b >= 16 && b <= 31) return true;
      // 192.168.x.x
      if (a === 192 && b === 168) return true;
      // 169.254.x.x (link-local)
      if (a === 169 && b === 254) return true;
    }

    return false;
  } catch {
    return true; // Invalid URL, treat as unsafe
  }
}

/**
 * Zod schema for validating public URLs
 */
export const publicUrlSchema = z
  .string()
  .min(1, 'URL is required')
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL must use http or https protocol')
  .refine((url) => !isPrivateUrl(url), 'Internal/private URLs are not allowed');

/**
 * Zod schema for competitor count validation
 */
export const competitorCountSchema = z
  .number()
  .int('Competitor count must be an integer')
  .min(1, 'Must request at least 1 competitor')
  .max(10, 'Cannot request more than 10 competitors');

/**
 * Schema for /api/analyze/start request
 */
export const startRequestSchema = z.object({
  url: publicUrlSchema,
  competitors: competitorCountSchema,
});

/**
 * Schema for /api/analyze/continue request
 */
export const continueRequestSchema = z.object({
  targetUrl: publicUrlSchema,
  targetProfile: z.object({
    companyName: z.string().min(1),
    industry: z.string().min(1),
    description: z.string().min(1),
    valueProposition: z.string().min(1),
    targetAudience: z.string().min(1),
    keyFeatures: z.array(z.string()),
    pricingModel: z.string().optional(),
    techStack: z.array(z.string()).optional(),
  }),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        description: z.string(),
        relevanceScore: z.number(),
        reasoning: z.string(),
      })
    )
    .min(1, 'At least one competitor is required'),
});

/**
 * Schema for /api/analyze/replace request
 */
export const replaceRequestSchema = z.object({
  targetProfile: z.object({
    companyName: z.string().min(1),
    industry: z.string().min(1),
    description: z.string().min(1),
    valueProposition: z.string().min(1),
    targetAudience: z.string().min(1),
    keyFeatures: z.array(z.string()),
    pricingModel: z.string().optional(),
    techStack: z.array(z.string()).optional(),
  }),
  excludeNames: z.array(z.string()),
  count: competitorCountSchema,
});

/**
 * Helper to safely parse JSON request body
 */
export async function safeParseJson<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(', ');
      return { success: false, error: errors };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}
