import { getSliceCenterAngle, polarToCartesian } from './geometry';
import { easeOutCubic } from './animation';
import { getLucideIconNode, type LucideIconAttrs, type LucideIconNode } from '../../utils/lucideIconRegistry';

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

      const drewLucideIcon = this.drawLucideIcon(slices[i].icon, pos.x, pos.y - labelSize * 0.6, iconSize, labelColor);
      if (!drewLucideIcon) {
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

  private drawLucideIcon(icon: string, centerX: number, centerY: number, size: number, color: string): boolean {
    const iconNode = getLucideIconNode(icon);
    if (!iconNode) return false;

    drawLucideNode(this.ctx, iconNode, centerX, centerY, size, color);
    return true;
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

function drawLucideNode(
  ctx: CanvasRenderingContext2D,
  iconNode: LucideIconNode,
  centerX: number,
  centerY: number,
  size: number,
  color: string,
): void {
  const scale = size / 24;

  ctx.save();
  ctx.translate(centerX - size / 2, centerY - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [elementName, attrs] of iconNode) {
    switch (elementName) {
      case 'circle':
        drawCircle(ctx, attrs);
        break;
      case 'ellipse':
        drawEllipse(ctx, attrs);
        break;
      case 'line':
        drawLine(ctx, attrs);
        break;
      case 'path':
        drawPath(ctx, attrs);
        break;
      case 'polygon':
        drawPoints(ctx, attrs, true);
        break;
      case 'polyline':
        drawPoints(ctx, attrs, false);
        break;
      case 'rect':
        drawRect(ctx, attrs);
        break;
    }
  }

  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  if (typeof attrs.d !== 'string') return;

  const path = new Path2D(attrs.d);
  if (hasFill(attrs)) ctx.fill(path);
  ctx.stroke(path);
}

function drawCircle(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  ctx.beginPath();
  ctx.arc(num(attrs.cx), num(attrs.cy), num(attrs.r), 0, Math.PI * 2);
  drawShape(ctx, attrs);
}

function drawEllipse(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  ctx.beginPath();
  ctx.ellipse(num(attrs.cx), num(attrs.cy), num(attrs.rx), num(attrs.ry), 0, 0, Math.PI * 2);
  drawShape(ctx, attrs);
}

function drawLine(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  ctx.beginPath();
  ctx.moveTo(num(attrs.x1), num(attrs.y1));
  ctx.lineTo(num(attrs.x2), num(attrs.y2));
  ctx.stroke();
}

function drawRect(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  const x = num(attrs.x);
  const y = num(attrs.y);
  const width = num(attrs.width);
  const height = num(attrs.height);
  const radius = Math.min(num(attrs.rx ?? attrs.ry), width / 2, height / 2);

  ctx.beginPath();
  if (radius > 0) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  } else {
    ctx.rect(x, y, width, height);
  }
  drawShape(ctx, attrs);
}

function drawPoints(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs, closePath: boolean): void {
  if (typeof attrs.points !== 'string') return;

  const points = attrs.points
    .trim()
    .split(/\s+/)
    .map((point) => point.split(',').map(Number))
    .filter((point): point is [number, number] => point.length === 2 && point.every(Number.isFinite));

  if (points.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) {
    ctx.lineTo(x, y);
  }
  if (closePath) ctx.closePath();
  drawShape(ctx, attrs);
}

function drawShape(ctx: CanvasRenderingContext2D, attrs: LucideIconAttrs): void {
  if (hasFill(attrs)) ctx.fill();
  ctx.stroke();
}

function hasFill(attrs: LucideIconAttrs): boolean {
  return typeof attrs.fill === 'string' && attrs.fill !== 'none';
}

function num(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return Number.parseFloat(value) || 0;
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
