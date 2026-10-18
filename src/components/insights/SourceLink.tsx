/** "Source: The Financial Express ↗": the published report a story, event or success story is based on. */
export function SourceLink({ url, name, label, className }: { url: string | null | undefined; name?: string | null; label: string; className?: string }) {
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  return (
    <p className={className ?? "text-sm text-text-secondary"}>
      {label}:{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-sky underline decoration-brand-sky/30 underline-offset-4 hover:decoration-brand-sky">
        {name || host} <span aria-hidden="true">↗</span>
      </a>
    </p>
  );
}
