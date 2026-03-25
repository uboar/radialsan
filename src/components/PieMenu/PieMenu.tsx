import React, { useRef, useState, useEffect } from 'react';
import { PieMenuRenderer, PieMenuRenderConfig, SliceRenderData } from './PieMenuRenderer';
import { getSliceAtPoint } from './geometry';

interface MenuState {
  visible: boolean;
  centerX: number;
  centerY: number;
  slices: SliceRenderData[];
  actions: Array<Array<{ type: string; params: Record<string, unknown> }>>;
  config: PieMenuRenderConfig;
}

export const PieMenu: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PieMenuRenderer | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const hoveredSliceRef = useRef<number | null>(null);

  // Keep ref in sync for event handlers.
  useEffect(() => {
    hoveredSliceRef.current = hoveredSlice;
  }, [hoveredSlice]);

  // Listen for show-menu event from Tauri.
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{
          cursorX: number;
          cursorY: number;
          slices?: SliceRenderData[];
          actions?: Array<Array<{ type: string; params: Record<string, unknown> }>>;
          config?: Partial<PieMenuRenderConfig>;
        }>('radialsan://show-menu', (event) => {
          const payload = event.payload;
          setMenuState({
            visible: true,
            centerX: payload.cursorX,
            centerY: payload.cursorY,
            slices: payload.slices ?? [],
            actions: payload.actions ?? [],
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
          });
          setHoveredSlice(null);
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
        unlisten = await listen<{ selected?: boolean }>('radialsan://hide-menu', async (event) => {
          const selected = event.payload?.selected ?? false;
          if (selected && hoveredSliceRef.current !== null && menuState?.actions) {
            const actions = menuState.actions[hoveredSliceRef.current];
            if (actions) {
              try {
                await invoke('execute_slice_actions', { actionsJson: actions });
              } catch (e) {
                console.error(e);
              }
            }
          }
          setMenuState(null);
          setHoveredSlice(null);
        });
      } catch {
        // Not running in Tauri context.
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, [menuState]);

  // Mouse move handler.
  useEffect(() => {
    if (!menuState?.visible) return;

    const handleMouseMove = (e: MouseEvent) => {
      const idx = getSliceAtPoint(
        e.clientX,
        e.clientY,
        menuState.centerX,
        menuState.centerY,
        menuState.slices.length,
        menuState.config.innerRadius,
        menuState.config.outerRadius,
        menuState.config.deadZoneRadius,
      );
      setHoveredSlice(idx);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [menuState]);

  // Render canvas.
  useEffect(() => {
    if (!canvasRef.current || !menuState?.visible) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new PieMenuRenderer(ctx, menuState.config);
    rendererRef.current.render(menuState.slices, hoveredSlice);
  }, [menuState, hoveredSlice]);

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
