import { describe, it, expect, vi } from "vitest";
import { MenuAnimator, easeOutCubic } from "../animation";

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => expect(easeOutCubic(0)).toBe(0));
  it("returns 1 at t=1", () => expect(easeOutCubic(1)).toBe(1));
  it("returns > 0.5 at t=0.5 (ease out)", () =>
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5));
});

describe("MenuAnimator", () => {
  it("calls onUpdate when shown", () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    // Mock requestAnimationFrame
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      setTimeout(cb, 16);
      return 0;
    });

    const animator = new MenuAnimator(onUpdate, 100, 80);
    animator.show(4);

    vi.advanceTimersByTime(200);

    expect(onUpdate).toHaveBeenCalled();
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall.openProgress).toBeGreaterThan(0);
    expect(lastCall.sliceHoverProgress).toHaveLength(4);

    animator.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("isFullyClosed returns true initially", () => {
    const animator = new MenuAnimator(() => {});
    expect(animator.isFullyClosed()).toBe(true);
    animator.destroy();
  });
});
