"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { redoAction, undoAction, undoRedoStatus } from "@/app/admin/(protected)/history/actions";

/**
 * Undo and Redo on every admin page. Undo reverses your most recent change
 * (one save, with everything it touched: an event and its photos, a page and
 * its blocks, a deletion, an item you added); Redo puts it back. Several undos
 * step further back; a new change clears what is waiting for Redo, as in any
 * editor. Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y) do the same when you are not
 * typing in a field, where they keep undoing your typing as usual.
 */
export function UndoBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<{ undo: string | null; redo: string | null }>({ undo: null, redo: null });
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [pending, start] = useTransition();

  const refresh = useCallback(() => {
    undoRedoStatus().then(setState).catch(() => null);
  }, []);
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    // After any save on the page (forms post, then the page refreshes), look again.
    const id = window.setInterval(refresh, 8000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  const run = useCallback(
    (which: "undo" | "redo") => {
      if (pending) return;
      start(async () => {
        const r = which === "undo" ? await undoAction() : await redoAction();
        setToast(r.ok ? { text: `${which === "undo" ? "Undone" : "Redone"}: ${r.label}`, tone: "ok" } : { text: r.message, tone: "error" });
        router.refresh();
        refresh();
      });
    },
    [pending, refresh, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey && state.undo) {
        e.preventDefault();
        run("undo");
      } else if (((k === "z" && e.shiftKey) || k === "y") && state.redo) {
        e.preventDefault();
        run("redo");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, state]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-control border border-fg/15 px-3 text-sm font-semibold transition-colors enabled:hover:border-brand-sky enabled:hover:text-brand-sky disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="relative flex items-center gap-2">
      <button type="button" onClick={() => run("undo")} disabled={!state.undo || pending} title={state.undo ? `Undo: ${state.undo} (Ctrl+Z)` : "Nothing to undo"} className={btn}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="M5.5 3 2.5 6l3 3M3 6h6.5a4 4 0 0 1 0 8H7" /></svg>
        Undo
      </button>
      <button type="button" onClick={() => run("redo")} disabled={!state.redo || pending} title={state.redo ? `Redo: ${state.redo} (Ctrl+Shift+Z)` : "Nothing to redo"} className={btn}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="M10.5 3l3 3-3 3M13 6H6.5a4 4 0 0 0 0 8H9" /></svg>
        Redo
      </button>
      {toast && (
        <p
          role="status"
          className={`absolute top-11 right-0 z-50 w-max max-w-[min(28rem,80vw)] rounded-card border px-3 py-2 text-sm shadow-lg ${toast.tone === "ok" ? "border-market-up/40 bg-ink-950 text-text-primary" : "border-market-down/50 bg-ink-950 text-market-down"}`}
        >
          {toast.text}
        </p>
      )}
    </div>
  );
}
