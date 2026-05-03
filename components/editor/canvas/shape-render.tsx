"use client";

import type { NodeShape } from "@/types/canvas";

interface ShapeBackgroundProps {
  shape: NodeShape;
  fill: string;
  stroke: string;
  strokeWidth: number;
  width: number;
  height: number;
}

export function ShapeBackground({
  shape,
  fill,
  stroke,
  strokeWidth,
  width,
  height,
}: ShapeBackgroundProps) {
  if (shape === "rectangle") {
    return (
      <div
        className="absolute inset-0 rounded-md"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px solid ${stroke}`,
        }}
      />
    );
  }

  if (shape === "pill" || shape === "circle") {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px solid ${stroke}`,
        }}
      />
    );
  }

  if (shape === "diamond") {
    const points = [
      `${width / 2},0`,
      `${width},${height / 2}`,
      `${width / 2},${height}`,
      `0,${height / 2}`,
    ].join(" ");
    return (
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    const inset = width * 0.25;
    const points = [
      `${inset},0`,
      `${width - inset},0`,
      `${width},${height / 2}`,
      `${width - inset},${height}`,
      `${inset},${height}`,
      `0,${height / 2}`,
    ].join(" ");
    return (
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    const ry = Math.max(6, height * 0.12);
    const rx = width / 2;
    const silhouette = `M 0 ${ry} A ${rx} ${ry} 0 0 1 ${width} ${ry} L ${width} ${height - ry} A ${rx} ${ry} 0 0 1 0 ${height - ry} Z`;
    const topRim = `M 0 ${ry} A ${rx} ${ry} 0 0 0 ${width} ${ry}`;
    return (
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          d={silhouette}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d={topRim}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  return null;
}
