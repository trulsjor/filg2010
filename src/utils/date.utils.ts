/**
 * Converts DD.MM.YYYY date format to YYYY-MM-DD for proper sorting
 */
export function convertDateForSorting(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
  }
  return dateStr;
}

/**
 * Sorts matches by date and time in ascending order
 * @param matches Array of matches with Dato and Tid properties
 * @returns New sorted array (does not mutate original)
 */
export function sortMatchesByDate<T extends { Dato: string; Tid: string }>(
  matches: T[]
): T[] {
  return [...matches].sort((a, b) => {
    const dateA = a.Dato || '';
    const dateB = b.Dato || '';
    const timeA = a.Tid || '';
    const timeB = b.Tid || '';

    const sortableDateA = convertDateForSorting(dateA);
    const sortableDateB = convertDateForSorting(dateB);

    // First compare dates
    const dateCompare = sortableDateA.localeCompare(sortableDateB);
    if (dateCompare !== 0) return dateCompare;

    // If dates are equal, compare times
    return timeA.localeCompare(timeB);
  });
}
