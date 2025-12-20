/**
 * HTTP-based result fetcher - no Playwright needed
 * Fetches match results directly from static HTML
 */

export interface MatchResult {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  result: string;
}

interface FetcherOptions {
  delayMs?: number;
  timeoutMs?: number;
}

export class ResultFetcherService {
  private readonly delayMs: number;
  private readonly timeoutMs: number;

  constructor(options: FetcherOptions = {}) {
    this.delayMs = options.delayMs ?? 300;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async fetchResult(matchUrl: string): Promise<MatchResult | null> {
    const matchId = this.extractMatchId(matchUrl);
    if (!matchId) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(matchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TerminlisteBot/1.0)',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return this.parseResultFromHtml(html, matchId);
    } catch (error) {
      console.error(`Failed to fetch ${matchUrl}:`, error);
      return null;
    }
  }

  async fetchMultipleResults(
    urls: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      onProgress?.(i + 1, urls.length);

      const result = await this.fetchResult(url);
      if (result) {
        results.set(result.matchId, result);
      }

      if (i < urls.length - 1) {
        await this.delay(this.delayMs);
      }
    }

    return results;
  }

  private parseResultFromHtml(html: string, matchId: string): MatchResult | null {
    // Look for score pattern in the nameresult section
    // Format: <th class="small-4 text-center"...><b>27</b>
    const scorePattern = /<th class="small-4 text-center"[^>]*><b>(\d+)<\/b>/g;
    const scores: number[] = [];

    let match;
    while ((match = scorePattern.exec(html)) !== null) {
      scores.push(parseInt(match[1], 10));
    }

    if (scores.length >= 2) {
      return {
        matchId,
        homeScore: scores[0],
        awayScore: scores[1],
        result: `${scores[0]}-${scores[1]}`,
      };
    }

    return null;
  }

  private extractMatchId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/matchid=(\d+)/);
    return match ? match[1] : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
