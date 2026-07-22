"use client";

import { motion } from "framer-motion";

/* deterministic pseudo-random so SSR and client match (no Math.random) */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function Sparkline({ seed = 7, color = "var(--violet)" }: { seed?: number; color?: string }) {
  const r = seeded(seed + 3);
  const n = 16;
  const W = 88;
  const H = 34;
  const pts = Array.from({ length: n }, (_, i) => {
    const y = 0.55 + 0.3 * Math.sin(i * 0.68 + seed) + (r() - 0.5) * 0.28;
    return [(i / (n - 1)) * W, H - Math.min(1, Math.max(0.08, y)) * (H - 4) - 2];
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const gid = `spk${seed}`;
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Donut({
  segments,
  size = 108,
  center,
  sub,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  center: string;
  sub?: string;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let off = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              initial={{ strokeDashoffset: -C }}
              animate={{ strokeDashoffset: -off }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          );
          off += len;
          return el;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>
            {center}
          </div>
          {sub && <div style={{ fontSize: 11, color: "var(--faint)" }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  Icon,
  label,
  value,
  sub,
  up,
  seed,
  color,
  delay = 0,
}: {
  Icon: (p: { size?: number }) => JSX.Element;
  label: string;
  value: string;
  sub?: string;
  up?: boolean;
  seed: number;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="card kpi"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -4 }}
    >
      <div className="khead">
        <span className="kico">
          <Icon size={18} />
        </span>
        {label}
      </div>
      <div className="kval">{value}</div>
      {sub && (
        <div className="ksub">
          {up && <span className="up">▲</span>}
          {sub}
        </div>
      )}
      <Sparkline seed={seed} color={color} />
    </motion.div>
  );
}
