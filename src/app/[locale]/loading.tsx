/**
 * Shown the moment a link is clicked while the next page is still being
 * prepared on the server (pages with live data, or any page while
 * developing), so the click answers at once. The header and footer stay in
 * place; only the page area shows this outline. Static pages that were
 * prefetched skip it and appear straight away.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="page-loading relative -mt-20 overflow-hidden pt-20 md:-mt-24 md:pt-24">
      <span className="sr-only">
        <span lang="en">Loading…</span> <span lang="bn">লোড হচ্ছে…</span>
      </span>
      <div aria-hidden="true" className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-8">
        <span className="skeleton h-3 w-28 rounded-full" />
        <span className="skeleton h-12 w-full max-w-2xl rounded-2xl md:h-16" />
        <span className="skeleton h-4 w-full max-w-xl rounded-full" />
        <span className="skeleton h-4 w-2/3 max-w-lg rounded-full" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
