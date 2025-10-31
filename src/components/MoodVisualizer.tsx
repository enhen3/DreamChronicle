import React, { useMemo } from "react";

type MoodVisualizerProps = {
  value: number; // 0-100
  color: string; // hex
};

// 将 hex 转 rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const value = hex.replace('#', '');
  const bigint = parseInt(value.length === 3 ? value.split('').map(c => c + c).join('') : value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 生成可变花瓣/星形路径：
// petals: 花瓣数量，innerR: 内径（越小越尖锐），outerR: 外径，roundness: 0~0.4 越大越圆润
const generatePetalPath = (petals: number, innerR: number, outerR: number, roundness: number): string => {
  const cx = 50;
  const cy = 50;
  const steps = petals * 2;
  const angleStep = (Math.PI * 2) / steps;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < steps; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  if (points.length === 0) return "";

  // 使用二次贝塞尔曲线在点之间做圆润过渡
  const ctrl = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // 将控制点向外推，形成更圆润的边
    const vx = mx - cx;
    const vy = my - cy;
    return { x: mx + vx * roundness, y: my + vy * roundness };
  };

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i <= points.length; i++) {
    const p1 = points[(i - 1) % points.length];
    const p2 = points[i % points.length];
    const c = ctrl(p1, p2);
    d += ` Q ${c.x},${c.y} ${p2.x},${p2.y}`;
  }
  d += " Z";
  return d;
};

export const MoodVisualizer: React.FC<MoodVisualizerProps> = ({ value, color }) => {
  const layers = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, value));
    // 层数、缩放与模糊强度随心情变化
    const count = 5; // 固定 5 层
    // 将整体缩放降为原来的 1/4
    const baseScale = (1 + (clamped - 50) / 300) * 0.25; // ≈0.21 - 0.29
    const wobble = (clamped - 50) / 1000; // 轻微律动差异
    const items = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const scale = baseScale * (1 + (0.25 - t * 0.22) + wobble * (i % 2 === 0 ? 1 : -1));
      const opacity = 0.5 - t * 0.42;
      const blur = 24 - t * 20; // 内发光更集中
      return { t, scale, opacity, blur };
    });
    return items;
  }, [value]);

  const fills = useMemo(() => {
    return [
      hexToRgba(color, 0.35),
      hexToRgba(color, 0.25),
      hexToRgba(color, 0.18),
      hexToRgba(color, 0.12),
      hexToRgba(color, 0.10),
    ];
  }, [color]);

  return (
    <div className="relative flex items-center justify-center w-full select-none">
      <svg
        viewBox="0 0 100 100"
        className="mood-visualizer-svg"
        aria-hidden
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layers.map((l, i) => {
          const clamped = Math.max(0, Math.min(100, value));
          // 花瓣数量：心情差更少、更尖锐；心情好更多、更饱满
          const petals = Math.round(6 + (clamped / 100) * 4); // 6..10
          // 尖锐度：内半径更小 -> 更锋利；心情好 -> 更圆润（内半径更大）
          const innerR = 18 + (clamped / 100) * 14; // 18..32
          const outerR = 40; // 固定外径（配合全局缩放已缩小）
          const roundness = 0.05 + (clamped / 100) * 0.28; // 0.05..0.33
          const pathD = generatePetalPath(petals, innerR, outerR, roundness);
          return (
          <g
            key={i}
            transform={`translate(50 50) rotate(${(i % 2 === 0 ? 6 : -6) * (value / 100)}) scale(${l.scale}) translate(-50 -50)`}
            className="mood-visualizer-rotate"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            <path
              d={pathD}
              fill={fills[i]}
              stroke={hexToRgba(color, 0.35)}
              strokeWidth={0.4}
              filter="url(#glow)"
              opacity={Math.max(0, Math.min(1, l.opacity))}
            />
          </g>
        );})}

        {/* 中心高光 */}
        <circle cx="50" cy="50" r="10" fill={hexToRgba(color, 0.22)} />
        <circle cx="50" cy="50" r="6" fill={hexToRgba('#ffffff', 0.12)} />
      </svg>
    </div>
  );
};

export default MoodVisualizer;


