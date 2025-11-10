const BASE_URL = 'https://www.handball.no';

/**
 * Normalizes a URL by adding base URL if relative
 */
export function normalizeUrl(href: string): string {
  if (!href) return '';
  return href.startsWith('http') ? href : `${BASE_URL}${href}`;
}

/**
 * Checks if URL is a match/game URL
 */
export function isMatchUrl(href: string): boolean {
  return href.includes('kampoppgjoer') || href.includes('/kamp/');
}

/**
 * Checks if URL is a team URL
 */
export function isTeamUrl(href: string): boolean {
  return href.includes('lagid=') || href.includes('/lag/');
}

/**
 * Checks if URL is a tournament URL
 */
export function isTournamentUrl(href: string): boolean {
  return href.includes('turnid=') || href.includes('/turnering/');
}

/**
 * Builds team page URL
 */
export function buildTeamUrl(lagid: string): string {
  return `${BASE_URL}/system/kamper/lag/?lagid=${lagid}#allmatches`;
}

/**
 * Builds API URL for team schedule
 */
export function buildApiUrl(lagid: string, seasonId: string): string {
  return `${BASE_URL}/AjaxData/TerminlisteLag?id=${lagid}&seasonId=${seasonId}`;
}
