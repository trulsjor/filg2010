export type ResultType = 'win' | 'draw' | 'loss'
export type DisplayLetter = 'S' | 'U' | 'T'

export class MatchResult {
  private readonly goalsScored: number
  private readonly goalsConceded: number

  constructor(goalsScored: number, goalsConceded: number) {
    this.goalsScored = goalsScored
    this.goalsConceded = goalsConceded
  }

  getType(): ResultType {
    if (this.goalsScored > this.goalsConceded) return 'win'
    if (this.goalsScored < this.goalsConceded) return 'loss'
    return 'draw'
  }

  getDisplayLetter(): DisplayLetter {
    const type = this.getType()
    if (type === 'win') return 'S'
    if (type === 'draw') return 'U'
    return 'T'
  }

  isWin(): boolean {
    return this.getType() === 'win'
  }

  isDraw(): boolean {
    return this.getType() === 'draw'
  }

  isLoss(): boolean {
    return this.getType() === 'loss'
  }
}
