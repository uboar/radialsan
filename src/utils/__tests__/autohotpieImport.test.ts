import { describe, it, expect } from "vitest";
import { convertAutoHotPieSettings } from "../autohotpieImport";

describe("convertAutoHotPieSettings", () => {
  it("converts basic profile with sendKey", () => {
    const ahp = {
      appProfiles: [
        {
          name: "Default",
          pieKeys: [
            {
              name: "Test Menu",
              hotkey: "^r",
              pieMenus: [
                {
                  radius: 50,
                  thickness: 100,
                  functions: [
                    {
                      label: "Copy",
                      ahkFunction: "sendKey",
                      functionParams: { keys: ["^c"] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = convertAutoHotPieSettings(ahp);
    expect(result.menus).toHaveLength(1);
    expect(result.profiles).toHaveLength(1);
    expect(result.menus![0].slices[0].label).toBe("Copy");
    expect(result.menus![0].slices[0].actions[0].type).toBe("sendKey");
  });

  it("converts AHK hotkey modifiers", () => {
    const ahp = {
      appProfiles: [
        {
          name: "Test",
          associatedProgram: "Photoshop",
          pieKeys: [
            {
              name: "PS Menu",
              hotkey: "!+a",
              pieMenus: [
                {
                  functions: [
                    {
                      label: "Test",
                      ahkFunction: "sendKey",
                      functionParams: { keys: [] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = convertAutoHotPieSettings(ahp);
    expect(result.profiles![0].matchRules).toHaveLength(1);
    expect(result.profiles![0].matchRules[0].value).toBe("Photoshop");
  });

  it("handles empty appProfiles", () => {
    const result = convertAutoHotPieSettings({ appProfiles: [] });
    expect(result.menus).toHaveLength(0);
    expect(result.profiles).toHaveLength(0);
  });
});
