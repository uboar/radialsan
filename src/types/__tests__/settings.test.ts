import { describe, expect, it } from "vitest";
import { mergeAppearance, type Appearance } from "../settings";

const globalAppearance: Appearance = {
  innerRadius: 40,
  outerRadius: 140,
  deadZoneRadius: 20,
  backgroundColor: "#00000080",
  sliceFillColor: "#2a2a2aCC",
  sliceHoverColor: "#4a9eff99",
  sliceBorderColor: "#555555",
  sliceBorderWidth: 1,
  labelFont: "system-ui",
  labelSize: 13,
  labelColor: "#FFFFFF",
  iconSize: 28,
  animationDurationMs: 100,
  opacity: 0.95,
};

describe("mergeAppearance", () => {
  it("uses global values when a menu has no overrides", () => {
    expect(mergeAppearance(globalAppearance, null)).toEqual(globalAppearance);
  });

  it("applies only the menu override fields", () => {
    expect(
      mergeAppearance(globalAppearance, {
        outerRadius: 180,
        innerRadius: undefined,
        deadZoneRadius: null,
        sliceHoverColor: "#ff00ff99",
        opacity: 0.5,
      }),
    ).toEqual({
      ...globalAppearance,
      outerRadius: 180,
      sliceHoverColor: "#ff00ff99",
      opacity: 0.5,
    });
  });
});
