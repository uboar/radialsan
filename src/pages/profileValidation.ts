import type { MatchRule, Profile } from "../types/settings";

export function sanitizeMatchRules(rules: readonly MatchRule[]): MatchRule[] {
  return rules
    .map((rule) => ({ ...rule, value: rule.value.trim() }))
    .filter((rule) => rule.value.length > 0);
}

export function canSaveProfileWithMatchRules(
  profile: Profile,
  rules: readonly MatchRule[],
): boolean {
  return profile.isDefault || sanitizeMatchRules(rules).length > 0;
}
