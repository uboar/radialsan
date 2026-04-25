import { describe, it, expect } from "vitest";
import {
  angleFromCenter,
  distance,
  getSliceIndex,
  isInRing,
  isInDeadZone,
  getSliceAtPoint,
  polarToCartesian,
  getSliceCenterAngle,
} from "../geometry";

describe("geometry", () => {
  describe("angleFromCenter", () => {
    it("point above → 0", () => {
      expect(angleFromCenter(0, 0, 0, -10)).toBeCloseTo(0, 5);
    });
    it("point right → π/2", () => {
      expect(angleFromCenter(0, 0, 10, 0)).toBeCloseTo(Math.PI / 2, 5);
    });
    it("point below → π", () => {
      expect(angleFromCenter(0, 0, 0, 10)).toBeCloseTo(Math.PI, 5);
    });
    it("point left → 3π/2", () => {
      expect(angleFromCenter(0, 0, -10, 0)).toBeCloseTo((3 * Math.PI) / 2, 5);
    });
  });

  describe("distance", () => {
    it("3-4-5 triangle", () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
    });
    it("same point", () => {
      expect(distance(5, 5, 5, 5)).toBe(0);
    });
  });

  describe("getSliceIndex", () => {
    it("4 slices: top → 0", () => {
      expect(getSliceIndex(0, 4)).toBe(0);
    });
    it("4 slices: right → 1", () => {
      expect(getSliceIndex(Math.PI / 2, 4)).toBe(1);
    });
    it("4 slices: bottom → 2", () => {
      expect(getSliceIndex(Math.PI, 4)).toBe(2);
    });
    it("4 slices: left → 3", () => {
      expect(getSliceIndex((3 * Math.PI) / 2, 4)).toBe(3);
    });
    it("8 slices: top → 0", () => {
      expect(getSliceIndex(0, 8)).toBe(0);
    });
    it("boundary: just before next slice", () => {
      // Slice 0 spans [-π/4, π/4] for 4 slices. Just before π/4 should still be slice 0.
      const sliceWidth = (2 * Math.PI) / 4;
      const justBefore = sliceWidth / 2 - 0.0001;
      expect(getSliceIndex(justBefore, 4)).toBe(0);
      // Just after π/4 should be slice 1.
      const justAfter = sliceWidth / 2 + 0.0001;
      expect(getSliceIndex(justAfter, 4)).toBe(1);
    });
  });

  describe("isInRing", () => {
    it("inside ring", () => {
      expect(isInRing(50, 40, 140)).toBe(true);
    });
    it("too close", () => {
      expect(isInRing(30, 40, 140)).toBe(false);
    });
    it("too far", () => {
      expect(isInRing(150, 40, 140)).toBe(false);
    });
    it("on inner boundary", () => {
      expect(isInRing(40, 40, 140)).toBe(true);
    });
    it("on outer boundary", () => {
      expect(isInRing(140, 40, 140)).toBe(true);
    });
  });

  describe("isInDeadZone", () => {
    it("inside", () => {
      expect(isInDeadZone(10, 20)).toBe(true);
    });
    it("outside", () => {
      expect(isInDeadZone(30, 20)).toBe(false);
    });
    it("on boundary", () => {
      expect(isInDeadZone(20, 20)).toBe(true);
    });
  });

  describe("getSliceAtPoint", () => {
    it("in ring returns slice index", () => {
      // Center at (100, 100), point directly above at distance 90 → in ring [40, 140], not in dead zone (20).
      // Point above center: (100, 10), distance = 90.
      const result = getSliceAtPoint(100, 10, 100, 100, 4, 40, 140, 20);
      expect(result).toBe(0); // Top slice.
    });
    it("in dead zone returns null", () => {
      // Point only 5 units from center.
      const result = getSliceAtPoint(100, 95, 100, 100, 4, 40, 140, 20);
      expect(result).toBeNull();
    });
    it("outside ring returns null", () => {
      // Point 200 units from center, beyond outerRadius of 140.
      const result = getSliceAtPoint(100, -100, 100, 100, 4, 40, 140, 20);
      expect(result).toBeNull();
    });
  });

  describe("polarToCartesian", () => {
    it("top (0 rad)", () => {
      const p = polarToCartesian(100, 100, 50, 0);
      expect(p.x).toBeCloseTo(100, 5);
      expect(p.y).toBeCloseTo(50, 5);
    });
    it("right (π/2 rad)", () => {
      const p = polarToCartesian(100, 100, 50, Math.PI / 2);
      expect(p.x).toBeCloseTo(150, 5);
      expect(p.y).toBeCloseTo(100, 5);
    });
  });

  describe("getSliceCenterAngle", () => {
    it("4 slices", () => {
      expect(getSliceCenterAngle(0, 4)).toBeCloseTo(0, 5);
      expect(getSliceCenterAngle(1, 4)).toBeCloseTo(Math.PI / 2, 5);
      expect(getSliceCenterAngle(2, 4)).toBeCloseTo(Math.PI, 5);
      expect(getSliceCenterAngle(3, 4)).toBeCloseTo((3 * Math.PI) / 2, 5);
    });
  });
});
