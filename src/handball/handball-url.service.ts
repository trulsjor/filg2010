/**
 * Service for handball.no URL operations
 */
export class HandballUrlService {
  private readonly baseUrl = 'https://www.handball.no'

  /**
   * Normalizes a URL by adding base URL if relative
   */
  normalizeUrl(href: string): string {
    if (!href) return ''
    return href.startsWith('http') ? href : `${this.baseUrl}${href}`
  }

  /**
   * Checks if URL is a match/game URL
   */
  isMatchUrl(href: string): boolean {
    return href.includes('kampoppgjoer') || href.includes('/kamp/')
  }

  /**
   * Checks if URL is a team URL
   */
  isTeamUrl(href: string): boolean {
    return href.includes('lagid=') || href.includes('/lag/')
  }

  /**
   * Checks if URL is a tournament URL
   */
  isTournamentUrl(href: string): boolean {
    return href.includes('turnid=') || href.includes('/turnering/')
  }

  /**
   * Builds team page URL
   */
  buildTeamUrl(lagid: string): string {
    return `${this.baseUrl}/system/kamper/lag/?lagid=${lagid}#allmatches`
  }

  /**
   * Builds API URL for team schedule
   */
  buildApiUrl(lagid: string, seasonId: string): string {
    return `${this.baseUrl}/AjaxData/TerminlisteLag?id=${lagid}&seasonId=${seasonId}`
  }
}
