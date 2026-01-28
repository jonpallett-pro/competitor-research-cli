'use client';

import { useState, useCallback } from 'react';

interface AnalyzeFormProps {
  onSubmit: (url: string, competitors: number) => void;
  isLoading: boolean;
}

/**
 * Check if a URL points to a private/internal network address
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

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
    return false; // Invalid URL will be caught by URL validation
  }
}

/**
 * Validate URL format
 */
function validateUrl(urlString: string): string | null {
  if (!urlString.trim()) {
    return null; // No error for empty input
  }

  // Add protocol if missing
  let normalizedUrl = urlString.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    const url = new URL(normalizedUrl);

    // Must be http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL must use http or https protocol';
    }

    // Check for private/internal URLs
    if (isPrivateUrl(normalizedUrl)) {
      return 'Internal/private URLs are not allowed';
    }

    return null; // Valid
  } catch {
    return 'Invalid URL format';
  }
}

export default function AnalyzeForm({ onSubmit, isLoading }: AnalyzeFormProps) {
  const [url, setUrl] = useState('');
  const [competitors, setCompetitors] = useState(5);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Only show validation errors after user has interacted
    if (touched && newUrl.trim()) {
      setUrlError(validateUrl(newUrl));
    } else {
      setUrlError(null);
    }
  }, [touched]);

  const handleUrlBlur = useCallback(() => {
    setTouched(true);
    if (url.trim()) {
      setUrlError(validateUrl(url));
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    // Add protocol if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Validate before submitting
    const error = validateUrl(url);
    if (error) {
      setUrlError(error);
      setTouched(true);
      return;
    }

    onSubmit(normalizedUrl, competitors);
  };

  const isValid = url.trim() && !urlError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            placeholder="https://example.com"
            disabled={isLoading}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
              urlError && touched
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            }`}
          />
          {urlError && touched && (
            <p className="mt-1 text-sm text-red-600">{urlError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="competitors" className="text-sm text-gray-600">
          Competitors:
        </label>
        <select
          id="competitors"
          value={competitors}
          onChange={(e) => setCompetitors(Number(e.target.value))}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {[3, 5, 7, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
