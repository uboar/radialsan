import { getSliceCenterAngle, polarToCartesian } from './geometry';
import { easeOutCubic } from './animation';

export interface PieMenuRenderConfig {
  centerX: number;
  centerY: number;
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
}

export interface SliceRenderData {
  label: string;
  icon: string;
  isSubmenu?: boolean;
}

export class PieMenuRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: PieMenuRenderConfig;

  constructor(ctx: CanvasRenderingContext2D, config: PieMenuRenderConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  render(slices: SliceRenderData[], hoveredIndex: number | null): void {
    this.clear();
    this.drawSlices(slices, hoveredIndex);
    this.drawLabels(slices, hoveredIndex);
    this.drawCenterCircle();
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  private drawSlices(slices: SliceRenderData[], hoveredIndex: number | null): void {
    const {
      centerX: cx,
      centerY: cy,
      innerRadius,
      outerRadius,
      sliceFillColor,
      sliceHoverColor,
      sliceBorderColor,
      sliceBorderWidth,
    } = this.config;
    const numSlices = slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    for (let i = 0; i < numSlices; i++) {
      const centerAngle = getSliceCenterAngle(i, numSlices);
      const startAngle = centerAngle - sliceAngle / 2;
      const endAngle = centerAngle + sliceAngle / 2;

      // Convert from our coordinate system (0=top, CW) to canvas (0=right, CW).
      const canvasStart = startAngle - Math.PI / 2;
      const canvasEnd = endAngle - Math.PI / 2;

      this.ctx.beginPath();
      this.ctx.arc(cx, cy, outerRadius, canvasStart, canvasEnd);
      this.ctx.arc(cx, cy, innerRadius, canvasEnd, canvasStart, true);
      this.ctx.closePath();

      this.ctx.fillStyle = i === hoveredIndex ? sliceHoverColor : sliceFillColor;
      this.ctx.fill();

      if (sliceBorderWidth > 0) {
        this.ctx.strokeStyle = sliceBorderColor;
        this.ctx.lineWidth = sliceBorderWidth;
        this.ctx.stroke();
      }
    }
  }

  private drawLabels(slices: SliceRenderData[], hoveredIndex: number | null): void {
    const { centerX: cx, centerY: cy, innerRadius, outerRadius, labelFont, labelSize, labelColor, iconSize } =
      this.config;
    const labelRadius = (innerRadius + outerRadius) / 2;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (let i = 0; i < slices.length; i++) {
      const angle = getSliceCenterAngle(i, slices.length);
      const pos = polarToCartesian(cx, cy, labelRadius, angle);

      // Draw icon (emoji or lucide placeholder).
      if (slices[i].icon.startsWith('lucide:')) {
        const iconName = slices[i].icon.replace('lucide:', '');
        // Draw a circle background
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y - labelSize * 0.6, iconSize * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.ctx.fill();
        // Draw icon initial
        this.ctx.fillStyle = labelColor;
        this.ctx.font = `bold ${iconSize * 0.45}px ${labelFont}`;
        this.ctx.fillText(iconName.charAt(0).toUpperCase(), pos.x, pos.y - labelSize * 0.55);
      } else {
        this.ctx.font = `${iconSize}px ${labelFont}`;
        this.ctx.fillStyle = labelColor;
        this.ctx.fillText(slices[i].icon, pos.x, pos.y - labelSize * 0.6);
      }

      // Draw label.
      this.ctx.font = `${i === hoveredIndex ? 'bold ' : ''}${labelSize}px ${labelFont}`;
      this.ctx.fillStyle = labelColor;
      this.ctx.fillText(slices[i].label, pos.x, pos.y + iconSize * 0.4);

      // Draw submenu indicator.
      if (slices[i].isSubmenu) {
        const angle = getSliceCenterAngle(i, slices.length);
        const indicatorPos = polarToCartesian(cx, cy, outerRadius - 10, angle);
        this.ctx.font = `${labelSize * 0.8}px ${labelFont}`;
        this.ctx.fillStyle = labelColor;
        this.ctx.fillText('▶', indicatorPos.x, indicatorPos.y);
      }
    }
  }

  private drawCenterCircle(): void {
    const { centerX: cx, centerY: cy, deadZoneRadius, backgroundColor } = this.config;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, deadZoneRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fill();
  }

  renderAnimated(
    slices: SliceRenderData[],
    hoveredIndex: number | null,
    animState: { openProgress: number; sliceHoverProgress: number[] },
  ): void {
    this.clear();

    const { centerX: cx, centerY: cy } = this.config;
    const scale = easeOutCubic(animState.openProgress);

    if (scale <= 0) return;

    // Apply scale transform
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-cx, -cy);

    // Set global alpha based on open progress
    this.ctx.globalAlpha = this.config.opacity * animState.openProgress;

    this.drawSlicesAnimated(slices, hoveredIndex, animState.sliceHoverProgress);
    this.drawLabels(slices, hoveredIndex);
    this.drawCenterCircle();

    this.ctx.restore();
  }

  private drawSlicesAnimated(
    slices: SliceRenderData[],
    _hoveredIndex: number | null,
    hoverProgress: number[],
  ): void {
    const numSlices = slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    for (let i = 0; i < numSlices; i++) {
      const centerAngle = getSliceCenterAngle(i, numSlices);
      const startAngle = centerAngle - sliceAngle / 2;
      const endAngle = centerAngle + sliceAngle / 2;
      const canvasStart = startAngle - Math.PI / 2;
      const canvasEnd = endAngle - Math.PI / 2;

      this.ctx.beginPath();
      this.ctx.arc(this.config.centerX, this.config.centerY, this.config.outerRadius, canvasStart, canvasEnd);
      this.ctx.arc(this.config.centerX, this.config.centerY, this.config.innerRadius, canvasEnd, canvasStart, true);
      this.ctx.closePath();

      // Blend between fill and hover color based on hover progress
      const hp = hoverProgress[i] || 0;
      if (hp > 0) {
        this.ctx.fillStyle = blendColors(this.config.sliceFillColor, this.config.sliceHoverColor, hp);
      } else {
        this.ctx.fillStyle = this.config.sliceFillColor;
      }
      this.ctx.fill();

      if (this.config.sliceBorderWidth > 0) {
        this.ctx.strokeStyle = this.config.sliceBorderColor;
        this.ctx.lineWidth = this.config.sliceBorderWidth;
        this.ctx.stroke();
      }
    }
  }

  updateConfig(config: Partial<PieMenuRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

function blendColors(color1: string, color2: string, t: number): string {
  // Parse hex colors (with optional alpha)
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  const a = c1.a + (c2.a - c1.a) * t;
  return `rgba(${r},${g},${b},${a})`;
}

function parseColor(hex: string): { r: number; g: number; b: number; a: number } {
  // Remove # prefix
  let h = hex.replace('#', '');
  let a = 1;
  if (h.length === 8) {
    a = parseInt(h.slice(6, 8), 16) / 255;
    h = h.slice(0, 6);
  } else if (h.length === 6) {
    a = 1;
  }
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
    a,
  };
}
