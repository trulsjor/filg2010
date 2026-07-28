export class HandballEndpoints {
  private readonly baseUrl = 'https://www.handball.no'

  teamSchedule(lagid: string, seasonId: string): string {
    return `${this.baseUrl}/api/AjaxData/TerminListeForTeam?id=${lagid}&seasonId=${seasonId}&width=1200`
  }

  teamTournaments(lagid: string): string {
    return `${this.baseUrl}/api/AjaxData/TournamentsForTeam?teamId=${lagid}&width=1200`
  }

  clubSearch(query: string, seasonId: string): string {
    const encoded = encodeURIComponent(query)
    return `${this.baseUrl}/api/servicedata/searchOrg?q=${encoded}&region=0&pageNumber=0&pageSize=100&type=o&seasonId=${seasonId}&classCode=0&width=1200`
  }

  tournamentPage(turnid: string): string {
    return `${this.baseUrl}/system/kamper/turnering/?turnid=${turnid}`
  }

  matchPage(matchId: string): string {
    return `${this.baseUrl}/system/kamper/kamp/?matchid=${matchId}`
  }

  teamPage(lagid: string): string {
    return `${this.baseUrl}/system/kamper/lag/?lagid=${lagid}`
  }
}
