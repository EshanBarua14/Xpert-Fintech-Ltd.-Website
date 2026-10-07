/**
 * A small set of line icons for feature cards. Admins type one of these
 * names in the card's "Icon name" field; unknown names show no icon.
 */
const PATHS: Record<string, string> = {
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z",
  lock: "M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  network: "M12 5a2 2 0 100-.01M5 19a2 2 0 100-.01M19 19a2 2 0 100-.01M12 7v4M12 11l-6 6M12 11l6 6",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-5.9",
  document: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h6",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  exchange: "M4 7h13l-3-3M20 17H7l3 3",
  check: "M5 12l5 5 9-10",
  cloud: "M7 18h10a4 4 0 00.5-8A6 6 0 006 10a4 4 0 001 8z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  phone: "M5 3h4l2 5-3 2a11 11 0 006 6l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z",
  id: "M3 5h18v14H3zM8 11a2 2 0 100-.01M6 16c.5-1.5 3.5-1.5 4 0M13 10h5M13 14h4",
  newspaper: "M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M7 9h7M7 13h7M7 16h4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9a1.5 1.5 0 100-.01",
  video: "M3 6h12v12H3zM15 10l6-3v10l-6-3",
  briefcase: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
  book: "M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11",
};

export const ICON_NAMES = Object.keys(PATHS);

export function Icon({ name, className }: { name: string | null | undefined; className?: string }) {
  const d = name ? PATHS[name] : undefined;
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-6 w-6"} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
