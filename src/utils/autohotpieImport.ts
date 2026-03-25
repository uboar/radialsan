import type { Settings, PieMenu, Slice, Action, Profile, PieKey } from '../types/settings';

/**
 * Convert AutoHotPie settings JSON to radialsan format.
 *
 * AutoHotPie format:
 * {
 *   global: { ... },
 *   appProfiles: [
 *     {
 *       name: string,
 *       enable: boolean,
 *       associatedProgram: string,  // window title regex
 *       pieKeys: [
 *         {
 *           hotkey: string,  // AHK key format: "^r" = Ctrl+R, "!+a" = Alt+Shift+A
 *           name: string,
 *           pieMenus: [
 *             {
 *               radius: number,
 *               thickness: number,
 *               functions: [
 *                 {
 *                   label: string,
 *                   icon: { filePath: string },
 *                   ahkFunction: string,
 *                   functionParams: { keys?: string[], ... }
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export function convertAutoHotPieSettings(ahpJson: any): Partial<Settings> {
  const menus: PieMenu[] = [];
  const profiles: Profile[] = [];
  let menuCounter = 0;

  // Convert each app profile
  const appProfiles: any[] = ahpJson.appProfiles || [];

  for (const ahpProfile of appProfiles) {
    const profileId = `profile_${Date.now()}_${menuCounter}`;
    const pieKeys: PieKey[] = [];

    for (const ahpPieKey of (ahpProfile.pieKeys || [])) {
      const menuId = `menu_imported_${menuCounter++}`;
      const ahpMenus: any[] = ahpPieKey.pieMenus || [];

      if (ahpMenus.length > 0) {
        const ahpMenu = ahpMenus[0]; // First pie menu (main)
        const slices: Slice[] = (ahpMenu.functions || []).map((fn: any, i: number) => ({
          id: `s_imp_${menuCounter}_${i}`,
          label: fn.label || `Action ${i + 1}`,
          icon: '⚡', // AutoHotPie uses image icons, we default to emoji
          actions: [convertAhpFunction(fn)],
        }));

        menus.push({
          id: menuId,
          name: ahpPieKey.name || `Imported Menu ${menuCounter}`,
          appearanceOverrides: {
            innerRadius: ahpMenu.radius || undefined,
            outerRadius: ahpMenu.radius ? ahpMenu.radius + (ahpMenu.thickness || 100) : undefined,
          },
          slices,
        });

        pieKeys.push({
          id: `pk_imp_${menuCounter}`,
          hotkey: convertAhkHotkey(ahpPieKey.hotkey || ''),
          menuId,
        });
      }
    }

    profiles.push({
      id: profileId,
      name: ahpProfile.name || 'Imported Profile',
      isDefault: ahpProfile.name === 'Default',
      matchRules: ahpProfile.associatedProgram
        ? [{
            field: 'windowTitle' as const,
            matchMode: 'regex' as const,
            value: ahpProfile.associatedProgram,
          }]
        : [],
      pieKeys,
    });
  }

  return { menus, profiles };
}

/**
 * Convert AHK hotkey format to radialsan format.
 * AHK: ^ = Ctrl, + = Shift, ! = Alt, # = Win
 * radialsan: "Ctrl+Shift+A"
 */
function convertAhkHotkey(ahk: string): string {
  const parts: string[] = [];
  let remaining = ahk;

  while (remaining.length > 0) {
    if (remaining.startsWith('^')) {
      parts.push('Ctrl');
      remaining = remaining.slice(1);
    } else if (remaining.startsWith('+')) {
      parts.push('Shift');
      remaining = remaining.slice(1);
    } else if (remaining.startsWith('!')) {
      parts.push('Alt');
      remaining = remaining.slice(1);
    } else if (remaining.startsWith('#')) {
      parts.push('Meta');
      remaining = remaining.slice(1);
    } else {
      // The rest is the key
      parts.push(ahkKeyToName(remaining));
      break;
    }
  }

  return parts.join('+');
}

function ahkKeyToName(key: string): string {
  const map: Record<string, string> = {
    'Space': 'Space',
    'Tab': 'Tab',
    'Enter': 'Enter',
    'Escape': 'Escape',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'CapsLock': 'CapsLock',
    'XButton1': 'Mouse4',
    'XButton2': 'Mouse5',
  };
  return map[key] || key.toUpperCase();
}

function convertAhpFunction(fn: any): Action {
  const ahkFunc: string = fn.ahkFunction || '';
  const params: any = fn.functionParams || {};

  switch (ahkFunc) {
    case 'sendKey':
      return {
        type: 'sendKey',
        params: {
          keys: (params.keys || []).join('+').replace(/\^/g, 'ctrl+').replace(/!/g, 'alt+').replace(/\+/g, 'shift+') || '',
        },
      };
    case 'sendText':
      return { type: 'sendText', params: { text: params.text || '' } };
    case 'mouseClick':
      return { type: 'mouseClick', params: { button: 'left', clicks: 1 } };
    case 'runScript':
      return { type: 'runCommand', params: { command: params.scriptPath || '', shell: true } };
    case 'openFolder':
      return { type: 'openFolder', params: { path: params.path || '' } };
    case 'openURL':
      return { type: 'openUrl', params: { url: params.url || '' } };
    case 'switchApplication':
      return { type: 'runCommand', params: { command: params.windowTitle || '', shell: false } };
    default:
      return { type: 'noop', params: {} };
  }
}
