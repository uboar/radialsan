import { describe, expect, it } from "vitest";
import {
  canSaveProfileWithMatchRules,
  sanitizeMatchRules,
} from "../profileValidation";
import type { Profile } from "../../types/settings";

const profile = (isDefault: boolean): Profile => ({
  id: isDefault ? "default" : "app",
  name: isDefault ? "Default" : "App",
  isDefault,
  matchRules: [],
  pieKeys: [],
});

describe("profileValidation", () => {
  it("does not allow non-default profiles to save with no usable match rules", () => {
    expect(canSaveProfileWithMatchRules(profile(false), [])).toBe(false);
    expect(
      canSaveProfileWithMatchRules(profile(false), [
        { field: "processName", matchMode: "contains", value: "   " },
      ]),
    ).toBe(false);
  });

  it("allows non-default profiles to save after a match rule value is provided", () => {
    expect(
      canSaveProfileWithMatchRules(profile(false), [
        { field: "processName", matchMode: "contains", value: " Code " },
      ]),
    ).toBe(true);
  });

  it("keeps default profiles saveable without match rules", () => {
    expect(canSaveProfileWithMatchRules(profile(true), [])).toBe(true);
  });

  it("trims and removes blank match rules before persistence", () => {
    expect(
      sanitizeMatchRules([
        { field: "processName", matchMode: "contains", value: " Code " },
        { field: "windowTitle", matchMode: "contains", value: " " },
      ]),
    ).toEqual([{ field: "processName", matchMode: "contains", value: "Code" }]);
  });
});
