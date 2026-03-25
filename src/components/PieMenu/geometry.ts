// Placeholder: geometry utilities for pie menu calculations

export interface Point {
  x: number;
  y: number;
}

export interface PieSlice {
  startAngle: number;
  endAngle: number;
  index: number;
}

/**
 * Calculate the angle (in radians) from center to a point.
 */
export function angleFromCenter(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

/**
 * Divide a full circle into equal slices.
 */
export function createEqualSlices(count: number): PieSlice[] {
  const sliceAngle = (2 * Math.PI) / count;
  return Array.from({ length: count }, (_, i) => ({
    startAngle: i * sliceAngle - Math.PI / 2,
    endAngle: (i + 1) * sliceAngle - Math.PI / 2,
    index: i,
  }));
}

/**
 * Determine which slice index a point falls into given a center and slice layout.
 */
export function hitTestSlice(
  center: Point,
  point: Point,
  slices: PieSlice[],
  deadZoneRadius: number,
): number | null {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < deadZoneRadius) return null;

  const angle = Math.atan2(dy, dx);
  for (const slice of slices) {
    let start = slice.startAngle;
    let end = slice.endAngle;
    // Normalise to [-π, π]
    if (end < start) end += 2 * Math.PI;
    let a = angle < start ? angle + 2 * Math.PI : angle;
    if (a >= start && a < end) return slice.index;
  }
  return null;
}
