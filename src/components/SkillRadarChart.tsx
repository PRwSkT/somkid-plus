"use client";

export interface RadarDimensionItem {
  key: string;
  label: string;
  shortLabel?: string;
  score: number; // 0 - 100
  benchmark?: number; // e.g. 70
}

interface SkillRadarChartProps {
  dimensions?: RadarDimensionItem[];
  scores?: Record<string, number>;
  size?: number;
  showBenchmark?: boolean;
  className?: string;
}

const LEGACY_DIMENSIONS = [
  { key: "conceptual", label: "ความเข้าใจแนวคิด", shortLabel: "ความเข้าใจแนวคิด" },
  { key: "applied", label: "การแก้โจทย์ประยุกต์", shortLabel: "โจทย์ประยุกต์" },
  { key: "logic", label: "ตรรกะและแบบรูป", shortLabel: "ตรรกะ" },
  { key: "accuracy", label: "ความแม่นยำและการคำนวณ", shortLabel: "ความแม่นยำ" },
  { key: "expression", label: "การสื่อสารและการตีความ", shortLabel: "การสื่อสาร" },
];

export function SkillRadarChart({
  dimensions,
  scores,
  size = 320,
  showBenchmark = true,
  className = "",
}: SkillRadarChartProps) {
  // Normalize items
  const items: RadarDimensionItem[] =
    dimensions && dimensions.length > 0
      ? dimensions
      : LEGACY_DIMENSIONS.map((d) => ({
          key: d.key,
          label: d.label,
          shortLabel: d.shortLabel,
          score: scores?.[d.key] ?? 50,
          benchmark: 70,
        }));

  const count = items.length || 5;

  // ViewBox layout with safe margins for labels
  const vbWidth = Math.max(380, Math.round(size * 1.25));
  const vbHeight = Math.max(340, Math.round(size * 1.05));
  const cx = vbWidth / 2;
  const cy = vbHeight / 2 - 4;
  const radius = size * 0.3;
  const gridLevels = [25, 50, 75, 100];

  const getPoint = (index: number, percent: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (radius * Math.max(0, Math.min(100, percent))) / 100;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Student Score Polygon
  const scorePolygon = items
    .map((item, idx) => {
      const p = getPoint(idx, Math.max(8, item.score));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  // Benchmark Polygon (Standard 70%)
  const benchmarkPolygon = items
    .map((item, idx) => {
      const p = getPoint(idx, item.benchmark ?? 70);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="w-full max-w-[420px] h-auto overflow-visible"
        role="img"
        aria-label="กราฟเรดาร์แสดงผลประเมินทักษะ 5 มิติเฉพาะวิชา"
      >
        <defs>
          <linearGradient id="scoreAreaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D1FF" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#1E5079" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D1FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00D1FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric grid pentagons */}
        {gridLevels.map((lvl) => {
          const pts = items
            .map((_, idx) => {
              const p = getPoint(idx, lvl);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <g key={lvl}>
              <polygon
                points={pts}
                fill={lvl === 100 ? "#F8FAFC" : "none"}
                stroke="#D3DEE8"
                strokeWidth={lvl === 100 ? "1.5" : "0.75"}
              />
              {/* Scale reference watermark (along top-right axis) */}
              <text
                x={cx + 6}
                y={cy - (radius * lvl) / 100 + 10}
                fill="#94A3B8"
                fontSize="8"
                fontWeight="500"
                fontFamily="inherit"
              >
                {lvl}%
              </text>
            </g>
          );
        })}

        {/* Benchmark 70% Reference Line */}
        {showBenchmark && (
          <polygon
            points={benchmarkPolygon}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.25"
            strokeDasharray="4 3"
          />
        )}

        {/* Axis Spokes and Dynamic Labels */}
        {items.map((item, idx) => {
          const outer = getPoint(idx, 100);
          const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Position text outside outer perimeter
          const labelDist = radius + 24;
          const lx = cx + labelDist * cos;
          const ly = cy + labelDist * sin;

          // Alignment logic based on quadrant
          let textAnchor: "middle" | "start" | "end" = "middle";
          if (cos > 0.3) textAnchor = "start";
          else if (cos < -0.3) textAnchor = "end";

          let dominantBaseline: "auto" | "central" | "hanging" = "central";
          if (sin < -0.6) dominantBaseline = "auto";
          else if (sin > 0.6) dominantBaseline = "hanging";

          const displayLabel = item.shortLabel || item.label;

          return (
            <g key={item.key}>
              {/* Spoke line */}
              <line
                x1={cx}
                y1={cy}
                x2={outer.x}
                y2={outer.y}
                stroke="#CBD5E1"
                strokeWidth="0.85"
              />

              {/* Label + Score Pill */}
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                className="select-none"
              >
                <tspan
                  fill="#0F2A42"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="inherit"
                >
                  {displayLabel}
                </tspan>
                <tspan
                  dx="4"
                  fill={
                    item.score >= 80
                      ? "#15803D"
                      : item.score >= 50
                      ? "#0284C7"
                      : "#B91C1C"
                  }
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="inherit"
                >
                  {item.score}%
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Student Score Filled Area */}
        <polygon
          points={scorePolygon}
          fill="url(#scoreAreaGrad)"
          stroke="#1E5079"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />

        {/* Score Vertices Dots */}
        {items.map((item, idx) => {
          const pt = getPoint(idx, Math.max(8, item.score));
          return (
            <g key={`dot-${item.key}`}>
              {/* Outer halo */}
              <circle cx={pt.x} cy={pt.y} r="7" fill="url(#dotGlow)" />
              {/* Core vertex */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#00D1FF"
                stroke="#0F2A42"
                strokeWidth="1.75"
              />
            </g>
          );
        })}
      </svg>

      {/* Legend below graph */}
      <figcaption className="flex flex-wrap items-center justify-center gap-5 pt-3 text-xs text-[#5A6F83]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3.5 h-1.5 bg-[#1E5079] rounded-sm" />
          <span className="font-medium text-[#0F2A42]">ผลคะแนนของนักเรียน</span>
        </span>
        {showBenchmark && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-0 border-t-2 border-dashed border-[#94A3B8]" />
            <span className="text-[#64748B]">เกณฑ์มาตรฐานอ้างอิง (70%)</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
