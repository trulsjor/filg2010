export class TeamSelection {
  private readonly selectedIds: Set<string>

  constructor(selectedIds: Set<string> = new Set()) {
    this.selectedIds = new Set(selectedIds)
  }

  isEmpty(): boolean {
    return this.selectedIds.size === 0
  }

  hasTeam(teamId: string): boolean {
    return this.selectedIds.has(teamId)
  }

  isTeamVisible(teamId: string): boolean {
    return this.isEmpty() || this.hasTeam(teamId)
  }

  toggle(teamId: string): TeamSelection {
    const next = new Set(this.selectedIds)
    if (next.has(teamId)) {
      next.delete(teamId)
    } else {
      next.add(teamId)
    }
    return new TeamSelection(next)
  }

  clear(): TeamSelection {
    return new TeamSelection()
  }

  count(): number {
    return this.selectedIds.size
  }
}
