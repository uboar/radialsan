import React, { useRef, useEffect } from 'react';
import { PieMenuRenderer } from '../PieMenu/PieMenuRenderer';
import type { Slice } from '../../types/settings';

interface MenuPreviewProps {
  slices: Slice[];
  selectedIndex: number | null;
  appearance: {
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
}

export const MenuPreview: React.FC<MenuPreviewProps> = ({ slices, selectedIndex, appearance }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const size = Math.min(container.clientWidth, 400);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 400; // Scale relative to 400px reference

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
  }, [slices, selectedIndex, appearance]);

  return (
    <div ref={containerRef} className="flex items-center justify-center bg-zinc-950 rounded-xl p-4 border border-zinc-800">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
};
