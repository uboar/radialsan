import { getSliceCenterAngle, polarToCartesian } from './geometry';

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

      // Draw icon (as text emoji/character).
      this.ctx.font = `${iconSize}px ${labelFont}`;
      this.ctx.fillStyle = labelColor;
      this.ctx.fillText(slices[i].icon, pos.x, pos.y - labelSize * 0.6);

      // Draw label.
      this.ctx.font = `${i === hoveredIndex ? 'bold ' : ''}${labelSize}px ${labelFont}`;
      this.ctx.fillStyle = labelColor;
      this.ctx.fillText(slices[i].label, pos.x, pos.y + iconSize * 0.4);
    }
  }

  private drawCenterCircle(): void {
    const { centerX: cx, centerY: cy, deadZoneRadius, backgroundColor } = this.config;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, deadZoneRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fill();
  }

  updateConfig(config: Partial<PieMenuRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
