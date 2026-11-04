import type { CSSProperties } from "react";

const spinBox: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

const COLS = 5;
const ROWS = 3;
const CELL_W = 27;
const CELL_H = 13;
const GAP = 2;
const PANEL_W = COLS * (CELL_W + GAP) - GAP;
const PANEL_H = ROWS * (CELL_H + GAP) - GAP;

export function SolarIllustration({ className }: { className?: string }) {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push(
        <rect key={`${r}-${c}`} x={c * (CELL_W + GAP)} y={r * (CELL_H + GAP)} width={CELL_W} height={CELL_H} rx="1.5" fill="url(#cell)" />,
      );
    }
  }

  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      role="img"
      aria-label="A house with solar panels on its roof, with energy flowing from the panels into the home"
    >
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0%" stopColor="#f6b24f" stopOpacity=".55" />
          <stop offset="100%" stopColor="#f6b24f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f5674" />
          <stop offset="100%" stopColor="#1b3247" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f1ea" />
        </linearGradient>
        <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9a5a3d" />
          <stop offset="100%" stopColor="#7d4530" />
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity=".4" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="panelClip">
          <rect width={PANEL_W} height={PANEL_H} rx="2" />
        </clipPath>
      </defs>

      <ellipse cx="240" cy="352" rx="210" ry="14" fill="#1c1b18" opacity=".06" />

      <g transform="translate(380 82)">
        <circle r="80" fill="url(#sunGlow)" className="animate-glow" style={spinBox} />
        <g className="animate-spin-slow" style={spinBox}>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="-2.5" y="-58" width="5" height="15" rx="2.5" fill="#e9962e" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r="30" fill="#e9962e" />
        <circle cx="-7" cy="-7" r="16" fill="#f6b24f" opacity=".55" />
      </g>

      <g strokeLinecap="round" strokeWidth="2" stroke="#e9962e" strokeDasharray="3 9" opacity=".6">
        <path d="M344 116 L300 168" className="animate-flow" />
        <path d="M356 132 L322 176" className="animate-flow" style={{ animationDelay: "-.8s" }} />
        <path d="M330 104 L262 164" className="animate-flow" style={{ animationDelay: "-1.6s" }} />
      </g>

      <g>
        <rect x="42" y="226" width="14" height="126" rx="3" fill="#c9d3c9" />
        <circle cx="49" cy="206" r="32" fill="#2f7a55" />
        <circle cx="33" cy="226" r="20" fill="#28694a" />
        <circle cx="66" cy="222" r="22" fill="#357f5b" />
      </g>

      <g>
        <rect x="128" y="226" width="236" height="126" rx="4" fill="url(#wall)" stroke="#d6d3cb" />
        <path d="M150 160 H342 L380 232 H112 Z" fill="url(#roof)" />
        <path d="M112 232 H380" stroke="#6f3a26" strokeWidth="5" strokeLinecap="round" />
        <path d="M150 160 H342" stroke="#6f3a26" strokeWidth="4" strokeLinecap="round" />

        <g transform={`translate(${246 - PANEL_W / 2} 172)`}>
          <rect x="-3" y="-3" width={PANEL_W + 6} height={PANEL_H + 6} rx="3" fill="#d9dde0" />
          <g clipPath="url(#panelClip)">
            {cells}
            <rect x="-50" y="-10" width="36" height={PANEL_H + 20} fill="url(#shine)" className="animate-[shine_6s_ease-in-out_infinite]" />
          </g>
        </g>

        <rect x="160" y="262" width="46" height="40" rx="3" fill="#dbe7ef" stroke="#b9c6cf" />
        <path d="M183 262 V302 M160 282 H206" stroke="#b9c6cf" strokeWidth="2" />
        <rect x="286" y="262" width="46" height="40" rx="3" fill="#fdf1df" stroke="#e8cfa5" />
        <path d="M309 262 V302 M286 282 H332" stroke="#e8cfa5" strokeWidth="2" />
        <rect x="226" y="284" width="40" height="68" rx="3" fill="#1f5f45" />
        <circle cx="257" cy="320" r="2.5" fill="#e8f1ec" />
      </g>

      <g>
        <path
          d="M322 196 C 380 196, 412 228, 412 296"
          fill="none"
          stroke="#1f5f45"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 8"
          className="animate-flow"
        />
        <rect x="394" y="298" width="36" height="48" rx="7" fill="#ffffff" stroke="#1f5f45" strokeWidth="2" />
        <path d="M414 310 L406 324 H416 L408 338" fill="none" stroke="#e9962e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <path d="M24 352 H456" stroke="#d6d3cb" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
