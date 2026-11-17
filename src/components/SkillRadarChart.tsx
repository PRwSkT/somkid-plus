"use client";

import { type SkillDimensionKey } from "@/data/somkid-data";

interface SkillRadarChartProps {
  scores: Record<SkillDimensionKey, number>; // 0 - 100
  size?: number;
}

const DIMENSIONS: SkillDimensionKey[] = [
  "conceptual",
  "applied",
  "logic",
  "accuracy",
  "expression",
];

const DIMENSION_LABELS: Record<
  SkillDimensionKey,
  { lines: string[] }
> = {
  conceptual: { lines: ["ความเข้าใจแนวคิด"] },
  applied: { lines: ["การวิเคราะห์", "โจทย์ประยุกต์"] },
  logic: { lines: ["ตรรกะ"] },
  accuracy: { lines: ["ความแม่นยำ"] },
  expression: { lines: ["การสื่อสาร"] },
};

export function SkillRadarChart({ scores, size = 320 }: SkillRadarChartProps) {
  // Proportional width with horizontal padding so labels never clip
  const vbWidth = Math.max(340, Math.round(size * 1.16));
  const vbHeight = size;
  const cx = vbWidth / 2;
  const cy = vbHeight / 2;
  const radius = size * 0.285;
  const levels = [25, 50, 75, 100];

  const getPoint = (index: number, percent: number) => {
    const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2;
    const r = (radius * percent) / 100;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = DIMENSIONS.map((dim, idx) => {
    const p = getPoint(idx, Math.max(10, scores[dim] ?? 0));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="w-full max-w-[340px] h-auto overflow-visible"
        role="img"
        aria-label="กราฟเรดาร์แสดงผลประเมินทักษะ 5 มิติ"
      >
        {/* Concentric pentagon grid */}
        {levels.map((lvl) => {
          const pts = DIMENSIONS.map((_, idx) => {
            const p = getPoint(idx, lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#D3DEE8"
              strokeWidth={lvl === 100 ? "1.25" : "0.75"}
            />
          );
        })}

        {/* Axis spokes and labels */}
        {DIMENSIONS.map((dim, idx) => {
          const outer = getPoint(idx, 100);
          const labelDist = idx === 0 ? 122 : idx === 1 || idx === 4 ? 126 : 124;
          const labelPt = getPoint(idx, labelDist);
          const labelCfg = DIMENSION_LABELS[dim];

          return (
            <g key={dim}>
              <line
                x1={cx}
                y1={cy}
                x2={outer.x}
                y2={outer.y}
                stroke="#D3DEE8"
                strokeWidth="0.75"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#0F2A42"
                fontSize="10.5"
                fontWeight="600"
              >
                {labelCfg.lines.length === 1 ? (
                  labelCfg.lines[0]
                ) : (
                  <>
                    <tspan x={labelPt.x} dy="-0.55em">
                      {labelCfg.lines[0]}
                    </tspan>
                    <tspan x={labelPt.x} dy="1.2em">
                      {labelCfg.lines[1]}
                    </tspan>
                  </>
                )}
              </text>
            </g>
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(30, 80, 121, 0.22)"
          stroke="#1E5079"
          strokeWidth="2"
        />

        {/* Data vertices */}
        {DIMENSIONS.map((dim, idx) => {
          const pt = getPoint(idx, Math.max(10, scores[dim] ?? 0));
          return (
            <circle
              key={dim}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="#00D1FF"
              stroke="#0F2A42"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </figure>
  );
}
