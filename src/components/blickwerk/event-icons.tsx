/**
 * Bespoke, stroke-based SVG pictograms for the Ereignis-Feed.
 * Kept in one file for stylistic consistency (same viewBox, stroke width,
 * rounded caps/joins) so filter chips and row icons feel like one set.
 */

const COMMON = {
  viewBox: "0 0 32 32",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

interface IconProps {
  className?: string;
  size?: number;
}

/* ---------------- Filter chip icons ---------------- */

// Green gear + checkmark hybrid → "Neutral"
export function GearCheckIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      {...COMMON}
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <g stroke="#16a34a" strokeWidth={1.8}>
        {/* gear teeth */}
        <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.7 6.7l2.1 2.1M23.2 23.2l2.1 2.1M6.7 25.3l2.1-2.1M23.2 8.8l2.1-2.1" />
        {/* gear body */}
        <circle cx="16" cy="16" r="7" fill="#dcfce7" />
      </g>
      {/* checkmark */}
      <path
        d="M12.5 16.5l2.5 2.5 5-5"
        stroke="#16a34a"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Red defect gear + warning triangle → "Fehler"
export function GearWarningIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      {...COMMON}
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <g stroke="#dc2626" strokeWidth={1.8}>
        {/* broken gear teeth (missing top-right tooth) */}
        <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.7 6.7l2.1 2.1M6.7 25.3l2.1-2.1M23.2 23.2l2.1 2.1" />
        {/* jagged crack line */}
        <path d="M15 9l1.5 3-2 2 2 2" strokeWidth={1.6} />
        <circle cx="14" cy="16" r="6.5" fill="#fee2e2" />
      </g>
      {/* warning triangle overlay bottom-right */}
      <path
        d="M22 18l4.5 7.5h-9z"
        fill="#dc2626"
        stroke="#dc2626"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path d="M22 21v2" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="22" cy="24.4" r="0.6" fill="#fff" />
    </svg>
  );
}

/* ---------------- Row icons ---------------- */

// Shared gripper claw drawn from top
function Gripper({ x = 10, y = 2, color = "#334155" }) {
  return (
    <g stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x + 6} ${y}v3`} />
      <path d={`M${x + 2} ${y + 3}h8`} />
      <path d={`M${x + 2} ${y + 3}v3l-1 2`} />
      <path d={`M${x + 10} ${y + 3}v3l1 2`} />
    </g>
  );
}

// "Gehäuse platziert" — black housing held by gripper over assembly plate
export function HousingPlacedIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...COMMON} width={size} height={size} className={className} aria-hidden>
      <Gripper x={9} y={2} />
      {/* black housing */}
      <rect x="10" y="11" width="12" height="7" rx="1.2" fill="#111827" stroke="#111827" strokeWidth={1.2} />
      <rect x="12" y="13" width="2.2" height="3" rx="0.4" fill="#4b5563" />
      <rect x="17.8" y="13" width="2.2" height="3" rx="0.4" fill="#4b5563" />
      {/* assembly plate */}
      <path d="M4 24h24" stroke="#64748b" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6 27h20" stroke="#94a3b8" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="1.5 2" />
    </svg>
  );
}

// Generic "gear placed into housing" — shared body, gear color varies
function GearIntoHousing({
  gearFill,
  gearStroke,
  showCheck,
  size = 22,
  className,
}: {
  gearFill: string;
  gearStroke: string;
  showCheck?: boolean;
} & IconProps) {
  return (
    <svg {...COMMON} width={size} height={size} className={className} aria-hidden>
      <Gripper x={9} y={2} />
      {/* housing outline below */}
      <path
        d="M4 22h24v3H4z"
        fill="#e2e8f0"
        stroke="#64748b"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path d="M8 22v-3h16v3" stroke="#94a3b8" strokeWidth={1.2} fill="none" />
      {/* gear */}
      <g stroke={gearStroke} strokeWidth={1.4}>
        <path d="M16 8v2M16 18v2M10 14h2M20 14h2M11.8 9.8l1.4 1.4M18.8 16.8l1.4 1.4M11.8 18.2l1.4-1.4M18.8 11.2l1.4-1.4" />
        <circle cx="16" cy="14" r="4" fill={gearFill} />
        <circle cx="16" cy="14" r="1.1" fill={gearStroke} stroke="none" />
      </g>
      {showCheck && (
        <g>
          <circle cx="25" cy="9" r="3.5" fill="#16a34a" />
          <path d="M23.4 9.2l1.1 1.1 2.1-2.1" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

// "Zahnrad gelb platziert" — yellow gear + alignment check
export function GearYellowPlacedIcon(props: IconProps) {
  return <GearIntoHousing gearFill="#facc15" gearStroke="#a16207" showCheck {...props} />;
}

// "Zahnrad weiß platziert" — white gear held over housing
export function GearWhitePlacedIcon(props: IconProps) {
  return <GearIntoHousing gearFill="#ffffff" gearStroke="#475569" {...props} />;
}

// "Falsche Orientierung" — tilted white gear + red rotation arrow + warning
export function WrongOrientationIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...COMMON} width={size} height={size} className={className} aria-hidden>
      {/* tilted gear group */}
      <g transform="rotate(28 15 16)">
        <g stroke="#475569" strokeWidth={1.4}>
          <path d="M15 8v2M15 22v2M7 16h2M21 16h2M9.5 10.5l1.4 1.4M19.1 20.1l1.4 1.4M9.5 21.5l1.4-1.4M19.1 11.9l1.4-1.4" />
          <circle cx="15" cy="16" r="4.5" fill="#ffffff" />
          <circle cx="15" cy="16" r="1.1" fill="#475569" stroke="none" />
        </g>
      </g>
      {/* curved red correction arrow */}
      <path
        d="M25 8a8 8 0 0 1-1 12"
        stroke="#dc2626"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 20l2 1 1-2.4" stroke="#dc2626" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* small warning dot */}
      <circle cx="27" cy="26" r="2.4" fill="#dc2626" />
      <path d="M27 25v1.4" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
      <circle cx="27" cy="27.6" r="0.5" fill="#fff" />
    </svg>
  );
}

// "Getriebe abgelegt" — gripper placing full gearbox into shelf, down arrow
export function GearboxStoredIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...COMMON} width={size} height={size} className={className} aria-hidden>
      <Gripper x={4} y={2} color="#334155" />
      {/* small gearbox being placed */}
      <rect x="4" y="11" width="10" height="6" rx="1" fill="#111827" stroke="#111827" strokeWidth={1} />
      <circle cx="7" cy="14" r="1.3" fill="#facc15" />
      <circle cx="11" cy="14" r="1.3" fill="#f8fafc" stroke="#475569" strokeWidth={0.6} />
      {/* down arrow into shelf */}
      <path d="M17 12v6M17 18l-1.6-1.6M17 18l1.6-1.6" stroke="#16a34a" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* shelf on the right */}
      <g stroke="#64748b" strokeWidth={1.3} fill="none" strokeLinejoin="round">
        <rect x="20" y="8" width="10" height="20" rx="0.6" />
        <path d="M20 15h10M20 22h10" />
      </g>
      {/* items on shelves */}
      <rect x="21.5" y="10" width="3" height="3.5" fill="#94a3b8" />
      <rect x="25.5" y="10.5" width="3" height="3" fill="#cbd5e1" />
      <rect x="21.5" y="17" width="3" height="3.5" fill="#cbd5e1" />
      <rect x="25.5" y="17" width="3" height="3.5" fill="#94a3b8" />
      <rect x="22" y="24" width="6.5" height="3" fill="#facc15" stroke="#a16207" strokeWidth={0.6} />
    </svg>
  );
}

/* ---------------- Router ---------------- */

export function iconForEventTitle(title?: string) {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes("gehäuse")) return HousingPlacedIcon;
  if (t.includes("gelb")) return GearYellowPlacedIcon;
  if (t.includes("weiß") || t.includes("weiss")) return GearWhitePlacedIcon;
  if (t.includes("falsch") || t.includes("orientierung")) return WrongOrientationIcon;
  if (t.includes("getriebe") || t.includes("abgelegt")) return GearboxStoredIcon;
  return null;
}
