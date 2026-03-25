export interface AnimationState {
  /** 0 to 1, controls menu open/close scale */
  openProgress: number;
  /** Per-slice hover progress, 0 to 1 */
  sliceHoverProgress: number[];
}

export class MenuAnimator {
  private openProgress = 0;
  private targetOpen = 0;
  private sliceHoverProgress: number[] = [];
  private targetSliceHover: number[] = [];
  private animationFrame: number | null = null;
  private onUpdate: (state: AnimationState) => void;
  private openDurationMs: number;
  private hoverDurationMs: number;
  private lastTime: number = 0;

  constructor(
    onUpdate: (state: AnimationState) => void,
    openDurationMs = 100,
    hoverDurationMs = 80,
  ) {
    this.onUpdate = onUpdate;
    this.openDurationMs = openDurationMs;
    this.hoverDurationMs = hoverDurationMs;
  }

  /** Show the menu (animate open) */
  show(numSlices: number): void {
    this.targetOpen = 1;
    this.sliceHoverProgress = new Array(numSlices).fill(0);
    this.targetSliceHover = new Array(numSlices).fill(0);
    this.startLoop();
  }

  /** Hide the menu (animate close) */
  hide(): void {
    this.targetOpen = 0;
    this.startLoop();
  }

  /** Set hovered slice index (null for none) */
  setHovered(index: number | null): void {
    for (let i = 0; i < this.targetSliceHover.length; i++) {
      this.targetSliceHover[i] = i === index ? 1 : 0;
    }
    this.startLoop();
  }

  /** Stop animation loop */
  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /** Check if fully closed (can be removed from DOM) */
  isFullyClosed(): boolean {
    return this.openProgress < 0.01 && this.targetOpen === 0;
  }

  private startLoop(): void {
    if (this.animationFrame !== null) return;
    this.lastTime = performance.now();
    this.tick();
  }

  private tick = (): void => {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    let needsUpdate = false;

    // Lerp open progress
    const openSpeed = dt / this.openDurationMs;
    if (this.openProgress !== this.targetOpen) {
      this.openProgress = lerp(this.openProgress, this.targetOpen, Math.min(openSpeed * 3, 1));
      if (Math.abs(this.openProgress - this.targetOpen) < 0.01) {
        this.openProgress = this.targetOpen;
      }
      needsUpdate = true;
    }

    // Lerp slice hover
    const hoverSpeed = dt / this.hoverDurationMs;
    for (let i = 0; i < this.sliceHoverProgress.length; i++) {
      if (this.sliceHoverProgress[i] !== this.targetSliceHover[i]) {
        this.sliceHoverProgress[i] = lerp(
          this.sliceHoverProgress[i],
          this.targetSliceHover[i],
          Math.min(hoverSpeed * 3, 1),
        );
        if (Math.abs(this.sliceHoverProgress[i] - this.targetSliceHover[i]) < 0.01) {
          this.sliceHoverProgress[i] = this.targetSliceHover[i];
        }
        needsUpdate = true;
      }
    }

    this.onUpdate({
      openProgress: this.openProgress,
      sliceHoverProgress: [...this.sliceHoverProgress],
    });

    if (needsUpdate) {
      this.animationFrame = requestAnimationFrame(this.tick);
    } else {
      this.animationFrame = null;
    }
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Ease out cubic for smooth deceleration */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
