export type SiteIconName = "dashboard" | "library" | "quiz" | "shop" | "inventory" | "progress" | "settings" | "profile" | "arrow" | "sparkle" | "lock" | "book";

interface SiteIconProps {
  name: SiteIconName;
  size?: number;
}

export function SiteIcon({ name, size = 20 }: SiteIconProps) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...shared}>
      {name === "dashboard" && <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="11" width="7" height="10" rx="2" /><rect x="3" y="14" width="8" height="7" rx="2" /></>}
      {name === "library" && <><path d="M4 5.5c3.1-1.3 6-.8 8 1.1v13c-2-1.8-4.9-2.3-8-1z" /><path d="M20 5.5c-3.1-1.3-6-.8-8 1.1v13c2-1.8 4.9-2.3 8-1z" /><path d="M7 9h2M7 12h2M15 9h2M15 12h2" /></>}
      {name === "quiz" && <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h5M8 16h6" /><path d="m15.5 15.5 1.2 1.2 2.3-2.5" /></>}
      {name === "shop" && <><path d="M4 8h16l-1.5 12h-13z" /><path d="M8 8a4 4 0 0 1 8 0M9 12v.1M15 12v.1" /></>}
      {name === "inventory" && <><path d="m4 7 8-4 8 4-8 4z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /><path d="M8 5l8 4" /></>}
      {name === "progress" && <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>}
      {name === "settings" && <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.8 1.8 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.8 1.8 0 0 0-1.5-1.2 1.8 1.8 0 0 0-1.8.8l-.1.2-3.1-1.5.1-.2a1.8 1.8 0 0 0-.2-1.9L5.7 16v-3.5l.2-.1a1.8 1.8 0 0 0 1.2-1.5 1.8 1.8 0 0 0-.8-1.8l-.2-.1 1.5-3.1.2.1a1.8 1.8 0 0 0 1.9-.2l.1-.1h3.5l.1.2a1.8 1.8 0 0 0 1.5 1.2 1.8 1.8 0 0 0 1.8-.8l.1-.2 3.1 1.5-.1.2a1.8 1.8 0 0 0 .2 1.9l.1.1v3.5z" /></>}
      {name === "profile" && <><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></>}
      {name === "arrow" && <><path d="M4 12h15M13 5l7 7-7 7" /></>}
      {name === "sparkle" && <path d="m12 2 2.4 7.1L22 12l-7.6 2.8L12 22l-2.5-7.2L2 12l7.5-2.9z" />}
      {name === "lock" && <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>}
      {name === "book" && <><path d="M4 5.5c3.1-1.3 6-.8 8 1.1v13c-2-1.8-4.9-2.3-8-1z" /><path d="M20 5.5c-3.1-1.3-6-.8-8 1.1v13c2-1.8 4.9-2.3 8-1z" /></>}
    </svg>
  );
}
