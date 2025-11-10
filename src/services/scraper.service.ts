import { chromium, type Page } from 'playwright';
import type { Team, MatchLink } from '../types/index.js';
import { HandballUrlService } from './handball-url.service.js';

const COOKIE_ACCEPT_TEXT = 'AKSEPTER';
const COOKIE_TIMEOUT = 5000;
const KAMPNR_REGEX = /^\d{9,}/;

/**
 * Service for scraping handball.no website
 */
export class ScraperService {
  private urlService = new HandballUrlService();
  /**
   * Handles cookie banner if present
   */
  private async handleCookieBanner(page: Page): Promise<void> {
    try {
      await page.click(`text=${COOKIE_ACCEPT_TEXT}`, { timeout: COOKIE_TIMEOUT });
      await page.waitForTimeout(1000);
    } catch {
      // Cookie banner not present or already accepted
    }
  }

  /**
   * Scrapes match links for a specific team
   */
  async scrapeMatchLinks(lagid: string): Promise<Map<string, MatchLink>> {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      const url = this.urlService.buildTeamUrl(lagid);

      await page.goto(url, { waitUntil: 'networkidle' });
      await this.handleCookieBanner(page);

      const matchLinks = await page.evaluate(
        ({ kampnrRegex }) => {
          const links: Array<{
            kampnr: string;
            kampUrl?: string;
            hjemmelagUrl?: string;
            bortelagUrl?: string;
          }> = [];
          const rows = document.querySelectorAll('tr');

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            let kampnr = '';
            let kampUrl = '';
            let hjemmelagUrl = '';
            let bortelagUrl = '';

            cells.forEach((cell) => {
              const text = cell.textContent?.trim() || '';

              // Look for kampnr (9+ digits)
              if (new RegExp(kampnrRegex).test(text)) {
                kampnr = text.trim();
              }

              const cellLinks = cell.querySelectorAll('a');
              cellLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (!href) return;

                const fullUrl = href.startsWith('http')
                  ? href
                  : `https://www.handball.no${href}`;

                if (href.includes('kampoppgjoer') || href.includes('/kamp/')) {
                  kampUrl = fullUrl;
                } else if (href.includes('lagid=') || href.includes('/lag/')) {
                  if (!hjemmelagUrl) {
                    hjemmelagUrl = fullUrl;
                  } else if (!bortelagUrl) {
                    bortelagUrl = fullUrl;
                  }
                }
              });
            });

            if (kampnr) {
              links.push({
                kampnr,
                kampUrl: kampUrl || undefined,
                hjemmelagUrl: hjemmelagUrl || undefined,
                bortelagUrl: bortelagUrl || undefined,
              });
            }
          });

          return links;
        },
        { kampnrRegex: KAMPNR_REGEX.source }
      );

      await browser.close();

      // Convert to Map for efficient lookup
      const linkMap = new Map<string, MatchLink>();
      matchLinks.forEach((link) => {
        const kampnr = link.kampnr.trim();
        if (!linkMap.has(kampnr)) {
          linkMap.set(kampnr, link);
        }
      });

      return linkMap;
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to scrape match links for team ${lagid}: ${error}`);
    }
  }

  /**
   * Scrapes tournament links from all team pages
   */
  async scrapeTournamentLinks(teams: Team[]): Promise<Map<string, string>> {
    const browser = await chromium.launch({ headless: true });
    const tournamentMap = new Map<string, string>();

    try {
      for (const team of teams) {
        const url = this.urlService.buildTeamUrl(team.lagid);
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'networkidle' });
        await this.handleCookieBanner(page);

        const tournamentLinks = await page.evaluate(() => {
          const links: Array<{ name: string; url: string }> = [];
          const anchors = document.querySelectorAll('a[href*="turnid="]');

          anchors.forEach((anchor) => {
            const href = anchor.getAttribute('href');
            const text = anchor.textContent?.trim() || '';

            if (href && text) {
              const url = href.startsWith('http')
                ? href
                : `https://www.handball.no${href}`;
              links.push({ name: text, url });
            }
          });

          return links;
        });

        // Add to map (deduplicated by tournament name)
        tournamentLinks.forEach((t) => {
          if (!tournamentMap.has(t.name)) {
            tournamentMap.set(t.name, t.url);
          }
        });

        await page.close();
      }

      await browser.close();
      return tournamentMap;
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to scrape tournament links: ${error}`);
    }
  }
}
