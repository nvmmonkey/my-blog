import React, { useRef } from "react";
import { useFrames } from "./motion";

// Small drawn instruments, one per project. They carry structure, never figures that are
// not in projects.js.

const LANES = [
  { name: "Hourly", marks: Array.from({ length: 24 }, (_, h) => h) },
  { name: "Narrative", marks: [0, 4, 8, 12, 16, 20] },
  { name: "Morning", marks: [7] },
  { name: "Evening", marks: [19] },
  { name: "Weekly", marks: [9] },
];

export function RhythmStrip({ compact = false }) {
  const needle = useRef(null);
  const wrap = useRef(null);
  const W = 720;
  const laneH = compact ? 44 : 30;
  const left = compact ? 0 : 96;
  const H = LANES.length * laneH + 28;
  const x = (h) => left + ((W - left - 8) * h) / 24;
  useFrames(wrap, (t) => {
    // one simulated day every 40 seconds
    const h = ((t / 40) * 24 + 6) % 24;
    if (needle.current) needle.current.setAttribute("transform", `translate(${x(h)} 0)`);
  });
  return (
    <div ref={wrap} className="instrument instrument--rhythm">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Five report lanes across a day: hourly, every four hours, morning, evening and weekly">
        {LANES.map((lane, i) => {
          const y = 8 + i * laneH + laneH / 2;
          return (
            <g key={lane.name}>
              {!compact && (
                <text x="0" y={y + 4} className="instrument__label">
                  {lane.name}
                </text>
              )}
              <line x1={left} x2={W - 8} y1={y} y2={y} className="instrument__rule" />
              {lane.marks.map((h) => (
                <rect key={h} x={x(h) - 2} y={y - laneH * 0.28} width="4" height={laneH * 0.56} rx="2" className="instrument__mark" />
              ))}
            </g>
          );
        })}
        {!compact &&
          [0, 6, 12, 18].map((h) => (
            <text key={h} x={x(h)} y={H - 2} className="instrument__label num">
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        <g ref={needle} transform={`translate(${x(9.5)} 0)`}>
          <line x1="0" x2="0" y1="2" y2={H - (compact ? 4 : 18)} className="instrument__needle" />
          <circle cx="0" cy="2" r="3" className="instrument__needle-dot" />
        </g>
      </svg>
    </div>
  );
}

export function CoverageMock() {
  return (
    <div className="instrument instrument--coverage" aria-hidden="true">
      <svg viewBox="0 0 320 240">
        <g className="coverage__ripples">
          <circle cx="160" cy="120" r="40" />
          <circle cx="160" cy="120" r="40" />
          <circle cx="160" cy="120" r="40" />
        </g>
        <rect x="128" y="62" width="64" height="116" rx="12" className="coverage__phone" />
        <rect x="150" y="68" width="20" height="4" rx="2" className="coverage__notch" />
        <g className="coverage__bars">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={142 + i * 10} y={150 - i * 9} width="6" height={10 + i * 9} rx="2" style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function RelayThumb() {
  const regions = [30, 62, 94, 126, 158, 190, 222, 254, 286];
  return (
    <div className="instrument instrument--relay" aria-hidden="true">
      <svg viewBox="0 0 320 240">
        <circle cx="34" cy="120" r="6" className="relay__node" />
        <rect x="128" y="104" width="48" height="32" rx="8" className="relay__hub" />
        <path d="M40 120 H128" className="relay__path" />
        {regions.map((y, i) => (
          <g key={y}>
            <path d={`M176 120 C 220 120, 240 ${y - 8}, 288 ${y - 8}`} className="relay__path" />
            <circle cx="292" cy={y - 8} r="4" className="relay__node" />
            <circle r="2.5" className="relay__packet" style={{ offsetPath: `path("M176 120 C 220 120, 240 ${y - 8}, 288 ${y - 8}")`, animationDelay: `${i * 0.37}s` }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function LedgerThumb() {
  const rows = [0.92, 0.64, 0.8, 0.48, 0.72, 0.56];
  return (
    <div className="instrument instrument--ledger" aria-hidden="true">
      <svg viewBox="0 0 320 240">
        {rows.map((w, i) => {
          const y = 40 + i * 30;
          return (
            <g key={i}>
              <line x1="24" x2="296" y1={y + 14} y2={y + 14} className="instrument__rule" />
              <circle cx="36" cy={y} r="5" className={i === 3 ? "ledger__open" : "ledger__done"} />
              <rect x="52" y={y - 4} width={180 * w} height="8" rx="4" className="ledger__bar" />
              <rect x={248} y={y - 4} width="48" height="8" rx="4" className="ledger__bar ledger__bar--dim" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Thumb({ slug }) {
  if (slug === "llm-digest") return <RhythmStrip compact />;
  if (slug === "solana-mev") return <RelayThumb />;
  if (slug === "westtelecom") return <CoverageMock />;
  return <LedgerThumb />;
}
