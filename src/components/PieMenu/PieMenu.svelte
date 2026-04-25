<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    PieMenuRenderer,
    type PieMenuRenderConfig,
    type SliceRenderData,
  } from "./PieMenuRenderer";
  import {
    angleFromCenter,
    distance,
    getSliceAtPoint,
    getSliceIndex,
  } from "./geometry";
  import { MenuAnimator } from "./animation";
  import { canEnterSubmenu, getParentPopState } from "./submenuNavigation";

  type MenuAction = { type: string; params: Record<string, unknown> };

  interface MenuState {
    visible: boolean;
    menuId: string;
    centerX: number;
    centerY: number;
    backendOriginX: number;
    backendOriginY: number;
    slices: SliceRenderData[];
    actions: MenuAction[][];
    config: PieMenuRenderConfig;
  }

  interface MenuStackEntry {
    menuId: string;
    slices: SliceRenderData[];
    actions: MenuAction[][];
    centerX: number;
    centerY: number;
    backendOriginX: number;
    backendOriginY: number;
  }

  interface ShowMenuPayload {
    menuId: string;
    cursorX: number;
    cursorY: number;
    backendOriginX?: number;
    backendOriginY?: number;
    slices?: Array<{ label: string; icon: string; actions?: MenuAction[] }>;
    actions?: MenuAction[][];
    config?: Partial<PieMenuRenderConfig>;
  }

  interface HideMenuPayload {
    selected?: boolean;
    menuId?: string;
    selectedIndex?: number | null;
  }

  interface MouseMovePayload {
    x: number;
    y: number;
    menuId?: string;
    selectedIndex?: number | null;
    rawX?: number;
    rawY?: number;
  }

  let canvas: HTMLCanvasElement | undefined;
  let renderer: PieMenuRenderer | null = null;
  let animator: MenuAnimator | null = null;
  let menuState: MenuState | null = null;
  let hoveredSlice: number | null = null;
  let menuStack: MenuStackEntry[] = [];
  let parentPopArmed = false;
  let pendingSubmenu = false;
  let renderVersion = 0;
  let renderedVersion = -1;
  let mounted = false;

  async function setBackendMenuContext(
    menuId: string,
    originX: number,
    originY: number,
    sliceCount: number,
    deadZoneRadius: number,
  ): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_active_menu_context", {
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
  ): Promise<{ slices: SliceRenderData[]; actions: MenuAction[][] } | null> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const settings = await invoke<{
        menus?: Array<{
          id: string;
          slices: Array<{
            label: string;
            icon: string;
            actions: MenuAction[];
          }>;
        }>;
      }>("get_settings");
      const menu = settings.menus?.find((m) => m.id === menuId);
      if (!menu) return null;
      return {
        slices: menu.slices.map((s) => ({
          label: s.label,
          icon: s.icon,
          isSubmenu: s.actions.some((a) => a.type === "submenu"),
        })),
        actions: menu.slices.map((s) => s.actions),
      };
    } catch {
      return null;
    }
  }

  function setHoveredSlice(index: number | null): void {
    hoveredSlice = index;
    animator?.setHovered(index);
  }

  function resetMenu(): void {
    menuState = null;
    menuStack = [];
    parentPopArmed = false;
    pendingSubmenu = false;
    setHoveredSlice(null);
    renderVersion += 1;
  }

  function restoreParent(parent: MenuStackEntry, deadZoneRadius: number): void {
    const current = menuState;
    if (!current) return;

    menuState = {
      ...current,
      menuId: parent.menuId,
      centerX: parent.centerX,
      centerY: parent.centerY,
      backendOriginX: parent.backendOriginX,
      backendOriginY: parent.backendOriginY,
      slices: parent.slices,
      actions: parent.actions,
      config: {
        ...current.config,
        centerX: parent.centerX,
        centerY: parent.centerY,
      },
    };
    renderVersion += 1;
    void setBackendMenuContext(
      parent.menuId,
      parent.backendOriginX,
      parent.backendOriginY,
      parent.slices.length,
      deadZoneRadius,
    );
    setHoveredSlice(null);
  }

  function popToParent(deadZoneRadius: number): void {
    const stack = [...menuStack];
    const parent = stack.pop();
    if (!parent) return;

    menuStack = stack;
    parentPopArmed = false;
    restoreParent(parent, deadZoneRadius);
  }

  async function enterSubmenu(
    menuId: string,
    cursorX: number,
    cursorY: number,
    backendOriginX: number,
    backendOriginY: number,
  ): Promise<void> {
    const current = menuState;
    if (!current) return;

    pendingSubmenu = true;
    try {
      const data = await loadSubmenu(menuId);
      if (!data) return;

      const latest = menuState;
      if (!latest || latest.menuId !== current.menuId) return;

      const stackEntry: MenuStackEntry = {
        menuId: current.menuId,
        slices: current.slices,
        actions: current.actions,
        centerX: current.centerX,
        centerY: current.centerY,
        backendOriginX: current.backendOriginX,
        backendOriginY: current.backendOriginY,
      };
      menuStack = [...menuStack, stackEntry];
      parentPopArmed = false;

      menuState = {
        ...latest,
        menuId,
        centerX: cursorX,
        centerY: cursorY,
        backendOriginX,
        backendOriginY,
        slices: data.slices,
        actions: data.actions,
        config: { ...latest.config, centerX: cursorX, centerY: cursorY },
      };
      renderVersion += 1;
      void setBackendMenuContext(
        menuId,
        backendOriginX,
        backendOriginY,
        data.slices.length,
        current.config.deadZoneRadius,
      );
      setHoveredSlice(null);
    } finally {
      pendingSubmenu = false;
    }
  }

  function showMenu(payload: ShowMenuPayload): void {
    const rawSlices = payload.slices ?? [];
    const slices: SliceRenderData[] = rawSlices.map((s, i) => {
      const sliceActions = payload.actions?.[i] ?? s.actions ?? [];
      return {
        label: s.label,
        icon: s.icon,
        isSubmenu: sliceActions.some((a) => a.type === "submenu"),
      };
    });
    const actions = payload.actions ?? rawSlices.map((s) => s.actions ?? []);

    menuState = {
      visible: true,
      menuId: payload.menuId,
      centerX: payload.cursorX,
      centerY: payload.cursorY,
      backendOriginX: payload.backendOriginX ?? payload.cursorX,
      backendOriginY: payload.backendOriginY ?? payload.cursorY,
      slices,
      actions,
      config: {
        centerX: payload.cursorX,
        centerY: payload.cursorY,
        innerRadius: payload.config?.innerRadius ?? 40,
        outerRadius: payload.config?.outerRadius ?? 140,
        deadZoneRadius: payload.config?.deadZoneRadius ?? 20,
        backgroundColor: payload.config?.backgroundColor ?? "#00000080",
        sliceFillColor: payload.config?.sliceFillColor ?? "#2a2a2aCC",
        sliceHoverColor: payload.config?.sliceHoverColor ?? "#4a9eff99",
        sliceBorderColor: payload.config?.sliceBorderColor ?? "#555555",
        sliceBorderWidth: payload.config?.sliceBorderWidth ?? 1,
        labelFont: payload.config?.labelFont ?? "system-ui",
        labelSize: payload.config?.labelSize ?? 13,
        labelColor: payload.config?.labelColor ?? "#FFFFFF",
        iconSize: payload.config?.iconSize ?? 28,
        opacity: payload.config?.opacity ?? 0.95,
      },
    };
    menuStack = [];
    parentPopArmed = false;
    pendingSubmenu = false;
    setHoveredSlice(null);
    renderVersion += 1;
  }

  async function hideMenu(payload: HideMenuPayload | undefined): Promise<void> {
    const selected = payload?.selected ?? false;
    const current = menuState;
    const backendOwnsSelection = Boolean(
      current && payload?.menuId === current.menuId,
    );
    const selectedIndex = backendOwnsSelection
      ? typeof payload?.selectedIndex === "number"
        ? payload.selectedIndex
        : null
      : hoveredSlice;

    if (selected && selectedIndex !== null && current?.actions) {
      const actions = current.actions[selectedIndex];
      if (actions) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("execute_slice_actions", { actionsJson: actions });
        } catch (e) {
          console.error(e);
        }
      }
    }

    resetMenu();
  }

  function handleEscape(): void {
    if (!menuState?.visible || menuStack.length === 0) return;
    popToParent(menuState.config.deadZoneRadius ?? 30);
  }

  function updateHoveredSlice(
    x: number,
    y: number,
    backendSelectedIndex: number | null = null,
    backendMenuId?: string,
    rawX?: number,
    rawY?: number,
  ): void {
    const current = menuState;
    if (!current?.visible) return;

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

    const dist = distance(x, y, current.centerX, current.centerY);
    if (dist > current.config.outerRadius) {
      const angle = angleFromCenter(current.centerX, current.centerY, x, y);
      const directionIdx = idx ?? getSliceIndex(angle, current.slices.length);
      const sliceActions = current.actions[directionIdx];
      const submenuAction = sliceActions?.find((a) => a.type === "submenu");
      if (submenuAction && submenuAction.params?.menuId) {
        const maxDepth = 3;
        if (canEnterSubmenu(pendingSubmenu, menuStack.length, maxDepth)) {
          void enterSubmenu(
            submenuAction.params.menuId as string,
            x,
            y,
            rawX ?? x,
            rawY ?? y,
          );
        }
      }
    }

    const parentPopState = getParentPopState(
      dist,
      current.config.deadZoneRadius,
      menuStack.length,
      parentPopArmed,
    );
    parentPopArmed = parentPopState.armed;
    if (parentPopState.shouldPop) {
      popToParent(current.config.deadZoneRadius);
    }
  }

  function setupRenderer(): void {
    const current = menuState;
    if (!canvas || !current?.visible) return;

    animator?.destroy();

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    renderer = new PieMenuRenderer(ctx, current.config);
    animator = new MenuAnimator(
      (state) => {
        const active = menuState;
        if (!active || !renderer || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderer.renderAnimated(active.slices, hoveredSlice, state);
      },
      100,
      80,
    );

    animator.show(current.slices.length);
    animator.setHovered(hoveredSlice);
  }

  function destroyRenderer(): void {
    animator?.destroy();
    animator = null;
    renderer = null;
    renderedVersion = -1;
  }

  onMount(() => {
    mounted = true;
    let disposed = false;
    const unlisteners: Array<() => void> = [];

    const addUnlistener = (unlisten: () => void): void => {
      if (disposed) {
        unlisten();
      } else {
        unlisteners.push(unlisten);
      }
    };

    const setupTauriListeners = async (): Promise<void> => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        addUnlistener(
          await listen<ShowMenuPayload>("radialsan://show-menu", (event) =>
            showMenu(event.payload),
          ),
        );
        addUnlistener(
          await listen<HideMenuPayload>(
            "radialsan://hide-menu",
            (event) => void hideMenu(event.payload),
          ),
        );
        addUnlistener(
          await listen<MouseMovePayload>("radialsan://mouse-move", (event) => {
            updateHoveredSlice(
              event.payload.x,
              event.payload.y,
              typeof event.payload.selectedIndex === "number"
                ? event.payload.selectedIndex
                : null,
              event.payload.menuId,
              typeof event.payload.rawX === "number"
                ? event.payload.rawX
                : undefined,
              typeof event.payload.rawY === "number"
                ? event.payload.rawY
                : undefined,
            );
          }),
        );
      } catch {
        // Not running in Tauri context.
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        handleEscape();
      }
    };
    const handleMouseMove = (event: MouseEvent): void => {
      updateHoveredSlice(event.clientX, event.clientY);
    };

    void setupTauriListeners();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      disposed = true;
      for (const unlisten of unlisteners) unlisten();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      destroyRenderer();
    };
  });

  onDestroy(() => {
    destroyRenderer();
  });

  $: if (mounted) {
    if (!menuState?.visible || !canvas) {
      destroyRenderer();
    } else if (renderedVersion !== renderVersion) {
      setupRenderer();
      renderedVersion = renderVersion;
    }
  }

  $: animator?.setHovered(hoveredSlice);
</script>

{#if menuState?.visible}
  <canvas bind:this={canvas} class="pie-menu-canvas"></canvas>
{/if}

<style>
  .pie-menu-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }
</style>
