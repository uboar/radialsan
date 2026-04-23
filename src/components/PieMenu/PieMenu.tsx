import React, { useRef, useState, useEffect } from 'react';
import { PieMenuRenderer, PieMenuRenderConfig, SliceRenderData } from './PieMenuRenderer';
import { getSliceAtPoint, distance, angleFromCenter, getSliceIndex } from './geometry';
import { MenuAnimator } from './animation';

interface MenuState {
  visible: boolean;
  menuId: string;
  centerX: number;
  centerY: number;
  slices: SliceRenderData[];
  actions: Array<Array<{ type: string; params: Record<string, unknown> }>>;
  config: PieMenuRenderConfig;
}

interface MenuStackEntry {
  menuId: string;
  slices: SliceRenderData[];
  actions: Array<Array<{ type: string; params: Record<string, unknown> }>>;
  centerX: number;
  centerY: number;
}

async function setBackendMenuContext(
  menuId: string,
  originX: number,
  originY: number,
  sliceCount: number,
  deadZoneRadius: number,
): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('set_active_menu_context', {
      menuId,
      originX,
      originY,
      sliceCount,
      deadZoneRadius,
    });
  } catch {
    // Not running in Tauri context.
  }
}

async function loadSubmenu(
  menuId: string,
): Promise<{ slices: SliceRenderData[]; actions: Array<Array<{ type: string; params: Record<string, unknown> }>> } | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const settings = await invoke<{
      menus?: Array<{
        id: string;
        slices: Array<{
          label: string;
          icon: string;
          actions: Array<{ type: string; params: Record<string, unknown> }>;
        }>;
      }>;
    }>('get_settings');
    const menu = settings.menus?.find((m) => m.id === menuId);
    if (!menu) return null;
    return {
      slices: menu.slices.map((s) => ({
        label: s.label,
        icon: s.icon,
        isSubmenu: s.actions.some((a) => a.type === 'submenu'),
      })),
      actions: menu.slices.map((s) => s.actions),
    };
  } catch {
    return null;
  }
}

export const PieMenu: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PieMenuRenderer | null>(null);
  const animatorRef = useRef<MenuAnimator | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const hoveredSliceRef = useRef<number | null>(null);
  const [menuStack, setMenuStack] = useState<MenuStackEntry[]>([]);
  const menuStackRef = useRef<MenuStackEntry[]>([]);
  const menuStateRef = useRef<MenuState | null>(null);

  // Keep refs in sync for event handlers.
  useEffect(() => {
    hoveredSliceRef.current = hoveredSlice;
  }, [hoveredSlice]);

  useEffect(() => {
    menuStackRef.current = menuStack;
  }, [menuStack]);

  useEffect(() => {
    menuStateRef.current = menuState;
  }, [menuState]);

  // Helper: enter a submenu by ID, centered at cursorX/cursorY.
  const enterSubmenu = async (menuId: string, cursorX: number, cursorY: number) => {
    const current = menuStateRef.current;
    if (!current) return;

    const data = await loadSubmenu(menuId);
    if (!data) return;

    // Push current menu onto stack.
    const stackEntry: MenuStackEntry = {
      menuId: current.menuId,
      slices: current.slices,
      actions: current.actions,
      centerX: current.centerX,
      centerY: current.centerY,
    };
    setMenuStack((prev) => {
      const next = [...prev, stackEntry];
      menuStackRef.current = next;
      return next;
    });

    setMenuState((prev) => {
      if (!prev) return null;
      const next: MenuState = {
        ...prev,
        menuId,
        centerX: cursorX,
        centerY: cursorY,
        slices: data.slices,
        actions: data.actions,
        config: { ...prev.config, centerX: cursorX, centerY: cursorY },
      };
      menuStateRef.current = next;
      return next;
    });
    void setBackendMenuContext(
      menuId,
      cursorX,
      cursorY,
      data.slices.length,
      current.config.deadZoneRadius,
    );
    setHoveredSlice(null);
    hoveredSliceRef.current = null;
  };

  // Listen for show-menu event from Tauri.
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{
          menuId: string;
          cursorX: number;
          cursorY: number;
          slices?: Array<{ label: string; icon: string; actions?: Array<{ type: string; params: Record<string, unknown> }> }>;
          actions?: Array<Array<{ type: string; params: Record<string, unknown> }>>;
          config?: Partial<PieMenuRenderConfig>;
        }>('radialsan://show-menu', (event) => {
          const payload = event.payload;

          // Compute isSubmenu from actions if available.
          const rawSlices = payload.slices ?? [];
          const slices: SliceRenderData[] = rawSlices.map((s, i) => {
            const sliceActions = payload.actions?.[i] ?? s.actions ?? [];
            return {
              label: s.label,
              icon: s.icon,
              isSubmenu: sliceActions.some((a) => a.type === 'submenu'),
            };
          });

          const actions: Array<Array<{ type: string; params: Record<string, unknown> }>> =
            payload.actions ?? rawSlices.map((s) => s.actions ?? []);

          const newState: MenuState = {
            visible: true,
            menuId: payload.menuId,
            centerX: payload.cursorX,
            centerY: payload.cursorY,
            slices,
            actions,
            config: {
              centerX: payload.cursorX,
              centerY: payload.cursorY,
              innerRadius: payload.config?.innerRadius ?? 40,
              outerRadius: payload.config?.outerRadius ?? 140,
              deadZoneRadius: payload.config?.deadZoneRadius ?? 20,
              backgroundColor: payload.config?.backgroundColor ?? '#00000080',
              sliceFillColor: payload.config?.sliceFillColor ?? '#2a2a2aCC',
              sliceHoverColor: payload.config?.sliceHoverColor ?? '#4a9eff99',
              sliceBorderColor: payload.config?.sliceBorderColor ?? '#555555',
              sliceBorderWidth: payload.config?.sliceBorderWidth ?? 1,
              labelFont: payload.config?.labelFont ?? 'system-ui',
              labelSize: payload.config?.labelSize ?? 13,
              labelColor: payload.config?.labelColor ?? '#FFFFFF',
              iconSize: payload.config?.iconSize ?? 28,
              opacity: payload.config?.opacity ?? 0.95,
            },
          };
          setMenuState(newState);
          menuStateRef.current = newState;
          setMenuStack([]);
          menuStackRef.current = [];
          setHoveredSlice(null);
          hoveredSliceRef.current = null;
        });
      } catch {
        // Not running in Tauri context (e.g., tests).
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, []);

  // Listen for hide-menu event.
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const { invoke } = await import('@tauri-apps/api/core');
        unlisten = await listen<{
          selected?: boolean;
          menuId?: string;
          selectedIndex?: number | null;
        }>('radialsan://hide-menu', async (event) => {
          const selected = event.payload?.selected ?? false;
          const current = menuStateRef.current;
          const backendOwnsSelection = current && event.payload?.menuId === current.menuId;
          const selectedIndex = backendOwnsSelection
            ? typeof event.payload?.selectedIndex === 'number'
              ? event.payload.selectedIndex
              : null
            : hoveredSliceRef.current;

          if (selected && selectedIndex !== null && current?.actions) {
            const actions = current.actions[selectedIndex];
            if (actions) {
              try {
                await invoke('execute_slice_actions', { actionsJson: actions });
              } catch (e) {
                console.error(e);
              }
            }
          }
          setMenuState(null);
          menuStateRef.current = null;
          setMenuStack([]);
          menuStackRef.current = [];
          setHoveredSlice(null);
          hoveredSliceRef.current = null;
        });
      } catch {
        // Not running in Tauri context.
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, []);

  // Escape key handler: pop back to parent menu.
  useEffect(() => {
    if (!menuState?.visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const stack = [...menuStackRef.current];
        if (stack.length > 0) {
          const parent = stack.pop()!;
          setMenuStack(stack);
          menuStackRef.current = stack;
          setMenuState((prev) => {
            if (!prev) return null;
            const next: MenuState = {
              ...prev,
              menuId: parent.menuId,
              centerX: parent.centerX,
              centerY: parent.centerY,
              slices: parent.slices,
              actions: parent.actions,
              config: { ...prev.config, centerX: parent.centerX, centerY: parent.centerY },
            };
            menuStateRef.current = next;
            return next;
          });
          void setBackendMenuContext(
            parent.menuId,
            parent.centerX,
            parent.centerY,
            parent.slices.length,
            menuStateRef.current?.config.deadZoneRadius ?? 30,
          );
          setHoveredSlice(null);
          hoveredSliceRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuState?.visible]);

  // Mouse move handler.
  useEffect(() => {
    if (!menuState?.visible) return;

    let unlisten: (() => void) | undefined;

    const updateHoveredSlice = (
      x: number,
      y: number,
      backendSelectedIndex: number | null = null,
      backendMenuId?: string,
    ) => {
      const current = menuStateRef.current;
      if (!current) return;

      const backendOwnsSelection = backendMenuId === current.menuId;
      const hasBackendSelection =
        backendOwnsSelection &&
        backendSelectedIndex !== null &&
        Number.isInteger(backendSelectedIndex) &&
        backendSelectedIndex >= 0 &&
        backendSelectedIndex < current.slices.length;
      const idx = backendOwnsSelection
        ? hasBackendSelection
          ? backendSelectedIndex
          : null
        : getSliceAtPoint(
            x,
            y,
            current.centerX,
            current.centerY,
            current.slices.length,
            current.config.innerRadius,
            current.config.outerRadius,
            current.config.deadZoneRadius,
          );
      setHoveredSlice(idx);
      hoveredSliceRef.current = idx;

      // Submenu threshold: when cursor moves past the outer radius in a submenu slice's direction.
      const dist = distance(x, y, current.centerX, current.centerY);
      if (dist > current.config.outerRadius) {
        // Determine which slice direction this is (even outside the ring).
        const angle = angleFromCenter(current.centerX, current.centerY, x, y);
        const directionIdx = idx ?? getSliceIndex(angle, current.slices.length);
        const sliceActions = current.actions[directionIdx];
        const submenuAction = sliceActions?.find((a) => a.type === 'submenu');
        if (submenuAction && submenuAction.params?.menuId) {
          const maxDepth = 3;
          if (menuStackRef.current.length < maxDepth) {
            enterSubmenu(submenuAction.params.menuId as string, x, y);
          }
        }
      }

      // Back navigation: if cursor moves into the dead zone while a parent exists, pop back.
      if (menuStackRef.current.length > 0 && dist <= current.config.deadZoneRadius) {
        const stack = [...menuStackRef.current];
        const parent = stack.pop()!;
        setMenuStack(stack);
        menuStackRef.current = stack;
        setMenuState((prev) => {
          if (!prev) return null;
          const next: MenuState = {
            ...prev,
            menuId: parent.menuId,
            centerX: parent.centerX,
            centerY: parent.centerY,
            slices: parent.slices,
            actions: parent.actions,
            config: { ...prev.config, centerX: parent.centerX, centerY: parent.centerY },
          };
          menuStateRef.current = next;
          return next;
        });
        void setBackendMenuContext(
          parent.menuId,
          parent.centerX,
          parent.centerY,
          parent.slices.length,
          current.config.deadZoneRadius,
        );
        setHoveredSlice(null);
        hoveredSliceRef.current = null;
      }
    };

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{
          x: number;
          y: number;
          menuId?: string;
          selectedIndex?: number | null;
        }>('radialsan://mouse-move', (event) => {
          updateHoveredSlice(
            event.payload.x,
            event.payload.y,
            typeof event.payload.selectedIndex === 'number' ? event.payload.selectedIndex : null,
            event.payload.menuId,
          );
        });
      } catch {
        // Not running in Tauri context.
      }
    };

    setup();

    const handleMouseMove = (e: MouseEvent) => {
      updateHoveredSlice(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      unlisten?.();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [menuState?.visible]);

  // Animator-driven render canvas.
  useEffect(() => {
    if (!canvasRef.current || !menuState?.visible) {
      animatorRef.current?.destroy();
      return;
    }

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const renderer = new PieMenuRenderer(ctx, menuState.config);
    rendererRef.current = renderer;

    const animator = new MenuAnimator((state) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderer.renderAnimated(menuState.slices, hoveredSliceRef.current, state);
    }, 100, 80);

    animatorRef.current = animator;
    animator.show(menuState.slices.length);

    return () => animator.destroy();
  }, [menuState?.visible, menuState?.centerX, menuState?.centerY, menuState?.slices]);

  // Propagate hover changes to animator.
  useEffect(() => {
    animatorRef.current?.setHovered(hoveredSlice);
  }, [hoveredSlice]);

  if (!menuState?.visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
      }}
    />
  );
};

export default PieMenu;
