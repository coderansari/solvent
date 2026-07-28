"use client";

import { motion } from "framer-motion";

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
          <div className="display donut-center">{center}</div>
          {sub && <div className="donut-sub">{sub}</div>}
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
  delay = 0,
}: {
  Icon: (p: { size?: number }) => JSX.Element;
  label: string;
  value: string;
  sub?: string;
  up?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className="card kpi"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ y: -3 }}
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
    </motion.div>
  );
}
