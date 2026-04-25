import { describe, it, expect } from "vitest";
import { parseRadialsanPackage } from "../sharing";

describe("parseRadialsanPackage", () => {
  it("parses a valid menu package", () => {
    const pkg = JSON.stringify({
      format: "radialsan",
      version: 1,
      type: "menu",
      exportedAt: "2024-01-01",
      menus: [
        {
          id: "old_id",
          name: "Test",
          slices: [
            {
              id: "s1",
              label: "A",
              icon: "⚡",
              actions: [{ type: "noop", params: {} }],
            },
          ],
        },
      ],
    });

    const result = parseRadialsanPackage(pkg);
    expect(result.menus).toHaveLength(1);
    expect(result.menus[0].id).not.toBe("old_id"); // ID should be regenerated
    expect(result.menus[0].name).toBe("Test");
  });

  it("throws on non-radialsan format", () => {
    expect(() => parseRadialsanPackage('{"not": "radialsan"}')).toThrow();
  });

  it("throws on missing menus", () => {
    expect(() => parseRadialsanPackage('{"format": "radialsan"}')).toThrow();
  });

  it("regenerates profile IDs and remaps menu references", () => {
    const pkg = JSON.stringify({
      format: "radialsan",
      version: 1,
      type: "profile",
      exportedAt: "2024-01-01",
      menus: [{ id: "menu_old", name: "M", slices: [] }],
      profiles: [
        {
          id: "prof_old",
          name: "P",
          isDefault: true,
          matchRules: [],
          pieKeys: [{ id: "pk1", hotkey: "F5", menuId: "menu_old" }],
        },
      ],
    });

    const result = parseRadialsanPackage(pkg);
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles![0].isDefault).toBe(false); // Never import as default
    expect(result.profiles![0].id).not.toBe("prof_old");
    // pieKey menuId should be remapped to new menu ID
    expect(result.profiles![0].pieKeys[0].menuId).toBe(result.menus[0].id);
  });

  it("remaps submenu action references", () => {
    const pkg = JSON.stringify({
      format: "radialsan",
      version: 1,
      type: "menu",
      exportedAt: "2024-01-01",
      menus: [
        {
          id: "menu_a",
          name: "A",
          slices: [
            {
              id: "s1",
              label: "Sub",
              icon: "▶",
              actions: [{ type: "submenu", params: { menuId: "menu_b" } }],
            },
          ],
        },
        { id: "menu_b", name: "B", slices: [] },
      ],
    });

    const result = parseRadialsanPackage(pkg);
    const submenuAction = result.menus[0].slices[0].actions[0];
    const params = submenuAction.params as Record<string, unknown>;
    // Should be remapped to new ID of menu_b
    expect(params.menuId).toBe(result.menus[1].id);
  });
});
