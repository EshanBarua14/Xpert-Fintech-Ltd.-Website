"use client";

/**
 * Empties every field in its row (the list item it sits in), so the row is
 * removed when the form is saved. Undo at the top brings it back after saving.
 */
export function ClearRowButton({ label = "Remove" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const row = e.currentTarget.closest("li");
        row?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((el) => {
          el.value = "";
        });
        row?.setAttribute("data-cleared", "");
      }}
      className="self-end text-sm font-semibold text-market-down hover:underline"
    >
      {label}
    </button>
  );
}
