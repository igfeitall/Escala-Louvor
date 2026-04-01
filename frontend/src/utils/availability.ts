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

    const currentServiceKeys = new Set(nextOverrides[row.matchedMember.id] ?? []);
    row.unavailableServices.forEach((service) => currentServiceKeys.add(service.serviceKey));
    nextOverrides[row.matchedMember.id] = [...currentServiceKeys].sort();
  });

  return nextOverrides;
}
