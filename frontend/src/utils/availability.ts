import type { AvailabilityOverride, ParseResult } from '../types';

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

export function mapOverridesToPayload(overrides: Record<string, string[]>): AvailabilityOverride[] {
  return Object.entries(overrides)
    .map(([memberId, unavailableServiceKeys]) => ({
      memberId,
      unavailableServiceKeys: [...new Set(unavailableServiceKeys)].sort(),
    }))
    .filter((override) => override.unavailableServiceKeys.length > 0);
}

export function mapOverridesToRecord(overrides: AvailabilityOverride[]) {
  return overrides.reduce<Record<string, string[]>>((record, override) => {
    record[override.memberId] = [...new Set(override.unavailableServiceKeys)].sort();
    return record;
  }, {});
}
