import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import type { PieMenu, Profile, PieKey } from '../types/settings';

export interface RadialsanPackage {
  format: 'radialsan';
  version: 1;
  exportedAt: string;
  type: 'menu' | 'profile' | 'bundle';
  menus: PieMenu[];
  profiles?: Profile[];
}

/**
 * Export a single menu as a .radialsan.json file
 */
export async function exportMenu(menu: PieMenu): Promise<void> {
  const pkg: RadialsanPackage = {
    format: 'radialsan',
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'menu',
    menus: [menu],
  };
  await saveJsonFile(pkg, `${sanitizeFilename(menu.name)}.radialsan.json`);
}

/**
 * Export a profile with its associated menus
 */
export async function exportProfile(profile: Profile, allMenus: PieMenu[]): Promise<void> {
  // Find menus referenced by this profile's pieKeys
  const referencedMenuIds = new Set(profile.pieKeys.map((pk: PieKey) => pk.menuId));
  const menus = allMenus.filter((m: PieMenu) => referencedMenuIds.has(m.id));

  const pkg: RadialsanPackage = {
    format: 'radialsan',
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'profile',
    menus,
    profiles: [profile],
  };
  await saveJsonFile(pkg, `${sanitizeFilename(profile.name)}.radialsan.json`);
}

/**
 * Export all menus and profiles as a bundle
 */
export async function exportBundle(menus: PieMenu[], profiles: Profile[]): Promise<void> {
  const pkg: RadialsanPackage = {
    format: 'radialsan',
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'bundle',
    menus,
    profiles,
  };
  await saveJsonFile(pkg, `radialsan_backup_${new Date().toISOString().slice(0, 10)}.radialsan.json`);
}

/**
 * Import a .radialsan.json package
 * Returns the parsed package or throws
 */
export function parseRadialsanPackage(jsonText: string): RadialsanPackage {
  const data = JSON.parse(jsonText);

  if (data.format !== 'radialsan') {
    throw new Error('Not a radialsan package file');
  }
  if (!data.menus || !Array.isArray(data.menus)) {
    throw new Error('Invalid package: missing menus array');
  }

  // Regenerate IDs to avoid conflicts
  const idMap = new Map<string, string>();

  // First pass: assign new IDs for all menus so cross-references can be remapped
  for (const menu of data.menus as PieMenu[]) {
    const newId = `menu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    idMap.set(menu.id, newId);
  }

  // Second pass: rebuild menus with new IDs and remap submenu references
  data.menus = data.menus.map((menu: PieMenu) => {
    const newId = idMap.get(menu.id)!;
    return {
      ...menu,
      id: newId,
      slices: menu.slices.map((s, i) => ({
        ...s,
        id: `s_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        // Update submenu references
        actions: s.actions.map(a => {
          if (a.type === 'submenu' && a.params && typeof a.params === 'object') {
            const params = a.params as Record<string, unknown>;
            const oldMenuId = params.menuId as string;
            if (oldMenuId && idMap.has(oldMenuId)) {
              return { ...a, params: { ...params, menuId: idMap.get(oldMenuId) } };
            }
          }
          return a;
        }),
      })),
    };
  });

  if (data.profiles) {
    data.profiles = data.profiles.map((profile: Profile) => ({
      ...profile,
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      isDefault: false, // Never import as default
      pieKeys: profile.pieKeys.map(pk => ({
        ...pk,
        id: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        menuId: idMap.get(pk.menuId) || pk.menuId,
      })),
    }));
  }

  return data;
}

/**
 * Trigger a file picker and read the selected .json file
 */
export async function pickJsonFile(): Promise<string> {
  const selected = await open({
    filters: [{ name: 'radialsan JSON', extensions: ['json'] }],
    multiple: false,
  });
  if (!selected) throw new Error('No file selected');
  const text = await readTextFile(selected);
  return text;
}

async function saveJsonFile(data: unknown, defaultFilename: string): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const filePath = await save({
    defaultPath: defaultFilename,
    filters: [{ name: 'radialsan JSON', extensions: ['json'] }],
  });
  if (!filePath) return; // User cancelled
  await writeTextFile(filePath, json);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}
