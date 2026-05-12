<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { PieMenuRenderer } from "../PieMenu/PieMenuRenderer";
  import { getSliceAtPoint, getSliceCenterAngle } from "../PieMenu/geometry";
  import type { Appearance, Slice } from "../../types/settings";

  export let slices: Slice[] = [];
  export let selectedIndex: number | null = null;
  export let appearance: Appearance;
  export let onSelect: ((sliceId: string) => void) | undefined = undefined;
  export let previewMode = false;

  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  let resizeObserver: ResizeObserver | null = null;
  let hoverIndex: number | null = null;
  let lastSize = 0;

  function renderPreview(): void {
    if (!canvas || !container || !appearance) return;

    const availableHeight =
      container.clientHeight > 0 ? container.clientHeight - 40 : 560;
    const size = Math.max(
      280,
      Math.min(container.clientWidth - 32, availableHeight, 560),
    );
    lastSize = size;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 400;

    const renderer = new PieMenuRenderer(ctx, {
      centerX,
      centerY,
      innerRadius: appearance.innerRadius * scale,
      outerRadius: appearance.outerRadius * scale,
      deadZoneRadius: appearance.deadZoneRadius * scale,
      backgroundColor: appearance.backgroundColor,
      sliceFillColor: appearance.sliceFillColor,
      sliceHoverColor: appearance.sliceHoverColor,
      sliceBorderColor: appearance.sliceBorderColor,
      sliceBorderWidth: appearance.sliceBorderWidth,
      labelFont: appearance.labelFont,
      labelSize: appearance.labelSize * scale,
      labelColor: appearance.labelColor,
      iconSize: appearance.iconSize * scale,
      opacity: appearance.opacity,
    });

    const sliceData = slices.map((s) => ({
      label: s.label,
      icon: s.icon,
      isSubmenu: s.actions[0]?.type === "submenu",
    }));
    renderer.render(
      sliceData,
      previewMode ? null : (hoverIndex ?? selectedIndex),
    );
    if (!previewMode) {
      drawEditorGuides(ctx, size, centerX, centerY, selectedIndex);
    }
  }

  function drawEditorGuides(
    ctx: CanvasRenderingContext2D,
    size: number,
    centerX: number,
    centerY: number,
    activeIndex: number | null,
  ): void {
    if (!appearance || slices.length === 0) return;

    const scale = size / 400;
    const outerRadius = appearance.outerRadius * scale;
    const innerRadius = appearance.innerRadius * scale;

    ctx.save();
    ctx.strokeStyle = "rgba(238, 245, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 8]);
    for (const radius of [
      innerRadius,
      outerRadius,
      appearance.deadZoneRadius * scale,
    ]) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const sliceWidth = (Math.PI * 2) / slices.length;
    for (let index = 0; index < slices.length; index += 1) {
      const boundary =
        getSliceCenterAngle(index, slices.length) - sliceWidth / 2;
      const x = centerX + outerRadius * Math.sin(boundary);
      const y = centerY - outerRadius * Math.cos(boundary);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    if (activeIndex !== null) {
      const angle = getSliceCenterAngle(activeIndex, slices.length);
      const handleRadius = outerRadius + 16;
      const handleX = centerX + handleRadius * Math.sin(angle);
      const handleY = centerY - handleRadius * Math.cos(angle);
      ctx.fillStyle = "#6ee7f9";
      ctx.shadowColor = "rgba(110, 231, 249, 0.6)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(handleX, handleY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function getPointerSlice(event: PointerEvent): number | null {
    if (!canvas || !appearance || slices.length === 0 || lastSize === 0) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (event.clientX - rect.left) * scale;
    const y = (event.clientY - rect.top) * scale;
    const radiusScale = lastSize / 400;

    return getSliceAtPoint(
      x,
      y,
      canvas.width / 2,
      canvas.height / 2,
      slices.length,
      appearance.innerRadius * radiusScale,
      appearance.outerRadius * radiusScale,
      appearance.deadZoneRadius * radiusScale,
    );
  }

  function handlePointerMove(event: PointerEvent) {
    hoverIndex = getPointerSlice(event);
    renderPreview();
  }

  function handlePointerLeave() {
    hoverIndex = null;
    renderPreview();
  }

  function handlePointerDown(event: PointerEvent) {
    const index = getPointerSlice(event);
    if (index === null) return;
    onSelect?.(slices[index].id);
  }

  onMount(() => {
    renderPreview();
    if (container) {
      resizeObserver = new ResizeObserver(() => renderPreview());
      resizeObserver.observe(container);
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });

  $: {
    slices;
    selectedIndex;
    appearance;
    previewMode;
    hoverIndex;
    renderPreview();
  }
</script>

<div
  bind:this={container}
  class="relative flex min-h-[24rem] flex-1 items-center justify-center overflow-hidden rounded-[14px] border border-cyan-200/10 bg-[#0b1018] p-4 shadow-[inset_0_0_70px_rgba(110,231,249,0.05)]"
>
  <div
    class="pointer-events-none absolute inset-0 opacity-70"
    style="background-image: linear-gradient(rgba(238,245,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(238,245,255,0.035) 1px, transparent 1px); background-size: 36px 36px;"
  ></div>
  <canvas
    bind:this={canvas}
    class={`relative z-10 max-w-full ${previewMode ? "cursor-default" : "cursor-crosshair"}`}
    on:pointermove={handlePointerMove}
    on:pointerleave={handlePointerLeave}
    on:pointerdown={handlePointerDown}
  ></canvas>
</div>
