import { useEffect } from 'react';

export interface ShowMenuPayload {
  menuId: string;
  cursorX: number;
  cursorY: number;
  backendOriginX?: number;
  backendOriginY?: number;
  slices: Array<{
    label: string;
    icon: string;
    actions: Array<{ type: string; params: Record<string, unknown> }>;
  }>;
  config: Record<string, unknown>;
}

export function useShowMenuEvent(callback: (payload: ShowMenuPayload) => void): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const fn = await listen<ShowMenuPayload>('radialsan://show-menu', (event) => {
          callback(event.payload);
        });
        unlisten = fn;
      } catch {
        // Not running in Tauri context.
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, [callback]);
}

export interface HideMenuPayload {
  selected: boolean;
  menuId?: string;
  selectedIndex?: number | null;
}

export function useHideMenuEvent(callback: (payload: HideMenuPayload) => void): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const fn = await listen<HideMenuPayload>('radialsan://hide-menu', (event) => {
          callback(event.payload);
        });
        unlisten = fn;
      } catch {
        // Not running in Tauri context.
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, [callback]);
}
