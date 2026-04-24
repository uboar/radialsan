<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { PieMenuRenderer } from '../PieMenu/PieMenuRenderer';
  import type { Slice } from '../../types/settings';

  export let slices: Slice[] = [];
  export let selectedIndex: number | null = null;
  export let appearance: {
    innerRadius: number;
    outerRadius: number;
    deadZoneRadius: number;
    backgroundColor: string;
    sliceFillColor: string;
    sliceHoverColor: string;
    sliceBorderColor: string;
    sliceBorderWidth: number;
    labelFont: string;
    labelSize: number;
    labelColor: string;
    iconSize: number;
    opacity: number;
  };

  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  let resizeObserver: ResizeObserver | null = null;

  function renderPreview(): void {
    if (!canvas || !container || !appearance) return;

    const size = Math.min(container.clientWidth, 400);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
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

    const sliceData = slices.map((s) => ({ label: s.label, icon: s.icon }));
    renderer.render(sliceData, selectedIndex);
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
    renderPreview();
  }
</script>

<div bind:this={container} class="flex items-center justify-center bg-theme-bg-primary rounded-xl p-4 border border-theme-border">
  <canvas bind:this={canvas} class="max-w-full"></canvas>
</div>
