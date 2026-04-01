import type { ParseResult } from '../types';

export function mergeOverridesFromParseResult(
  currentOverrides: Record<string, string[]>,
  parseResult: ParseResult,
) {
  const nextOverrides: Record<string, string[]> = { ...currentOverrides };

  parseResult.parsedRows.forEach((row) => {
    if (!row.matchedMember) {
      return;
    }

    const currentDates = new Set(nextOverrides[row.matchedMember.id] ?? []);
    row.unavailableDates.forEach((date) => currentDates.add(date));
    nextOverrides[row.matchedMember.id] = [...currentDates].sort();
  });

  return nextOverrides;
}
