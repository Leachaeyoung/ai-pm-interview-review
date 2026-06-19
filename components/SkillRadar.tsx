'use client';

import type { SelfAssessment } from '@/lib/types';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 30;
const LEVELS = 5;

function polarToCartesian(angle: number, radius: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

export default function SkillRadar({ data }: { data: SelfAssessment[] }) {
  const n = data.length;
  const angleStep = 360 / n;

  // 背景网格
  const gridPolygons = Array.from({ length: LEVELS }, (_, level) => {
    const r = (RADIUS * (level + 1)) / LEVELS;
    const points = Array.from({ length: n }, (_, i) => {
      const [x, y] = polarToCartesian(i * angleStep, r);
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={level}
        points={points}
        fill="none"
        stroke="rgb(64 64 64)"
        strokeWidth="0.5"
      />
    );
  });

  // 轴线
  const axes = Array.from({ length: n }, (_, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS);
    return (
      <line
        key={i}
        x1={CENTER}
        y1={CENTER}
        x2={x}
        y2={y}
        stroke="rgb(64 64 64)"
        strokeWidth="0.5"
      />
    );
  });

  // 数据多边形
  const dataPoints = Array.from({ length: n }, (_, i) => {
    const r = (data[i].score / 10) * RADIUS;
    const [x, y] = polarToCartesian(i * angleStep, r);
    return `${x},${y}`;
  }).join(' ');

  // 标签
  const labels = data.map((d, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS + 20);
    const dx = x > CENTER ? 4 : x < CENTER ? -4 : 0;
    const dy = y > CENTER ? 14 : y < CENTER ? -4 : 4;
    return (
      <text
        key={i}
        x={x}
        y={y}
        dx={dx}
        dy={dy}
        textAnchor={x > CENTER ? 'start' : x < CENTER ? 'end' : 'middle'}
        fill="rgb(163 163 163)"
        fontSize="11"
      >
        {d.dimension}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[300px] h-auto">
      {gridPolygons}
      {axes}
      <polygon
        points={dataPoints}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="rgb(96 165 250)"
        strokeWidth="1.5"
      />
      {data.map((d, i) => {
        const r = (d.score / 10) * RADIUS;
        const [cx, cy] = polarToCartesian(i * angleStep, r);
        return (
          <circle key={i} cx={cx} cy={cy} r="3" fill="rgb(96 165 250)" />
        );
      })}
      {labels}
    </svg>
  );
}
