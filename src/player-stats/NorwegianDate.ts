export class NorwegianDate {
  private readonly date: Date

  private constructor(date: Date) {
    this.date = date
  }

  static fromString(dateString: string): NorwegianDate {
    const [day, month, year] = dateString.split('.')
    return new NorwegianDate(new Date(Number(year), Number(month) - 1, Number(day)))
  }

  getTime(): number {
    return this.date.getTime()
  }

  isAfter(other: NorwegianDate): boolean {
    return this.date.getTime() > other.date.getTime()
  }

  isBefore(other: NorwegianDate): boolean {
    return this.date.getTime() < other.date.getTime()
  }
}
