import { describe, expect, it } from "vitest";
import { getLucideIconName, getLucideIconNode } from "../lucideIconRegistry";

describe("lucideIconRegistry", () => {
  it("normalizes picker values and typed kebab-case icon names", () => {
    expect(getLucideIconName("lucide:Scissors")).toBe("Scissors");
    expect(getLucideIconName("lucide:clipboard-paste")).toBe("ClipboardPaste");
    expect(getLucideIconName("lucide:refresh-cw")).toBe("RefreshCw");
  });

  it("returns node data for canvas rendering", () => {
    const node = getLucideIconNode("lucide:Scissors");

    expect(node).not.toBeNull();
    expect(node?.some(([elementName]) => elementName === "path")).toBe(true);
  });

  it("ignores non-lucide and unknown icons", () => {
    expect(getLucideIconName("✂️")).toBeNull();
    expect(getLucideIconNode("lucide:not-real")).toBeNull();
  });
});
