/**
 * Small, simple glyphs for contact and professional-network links (email,
 * LinkedIn, Facebook, YouTube, X, Instagram, website). Chosen from the link
 * address, so admins only paste the URL.
 */
export type SocialKind = "email" | "linkedin" | "facebook" | "youtube" | "x" | "instagram" | "web";

export function socialKind(url: string): SocialKind {
  const u = url.toLowerCase();
  if (u.startsWith("mailto:")) return "email";
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("facebook.") || u.includes("fb.com") || u.includes("fb.me")) return "facebook";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.") || /\/\/(www\.)?x\.com/.test(u)) return "x";
  if (u.includes("instagram.")) return "instagram";
  return "web";
}

export function SocialIcon({ kind, className = "size-4" }: { kind: SocialKind; className?: string }) {
  const common = { className, "aria-hidden": true as const, viewBox: "0 0 24 24" };
  switch (kind) {
    case "email":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.5 4.77 5.76v5.69h-4v-5.04c0-1.2-.02-2.75-1.7-2.75-1.7 0-1.96 1.3-1.96 2.66v5.13h-4z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M14 8.5V6.8c0-.8.5-1.3 1.4-1.3H17V2.2C16.6 2.1 15.4 2 14.1 2 11.3 2 9.5 3.7 9.5 6.6v1.9H7v3.4h2.5V22H14V11.9h2.7l.4-3.4z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M17.7 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.6z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
        </svg>
      );
  }
}
