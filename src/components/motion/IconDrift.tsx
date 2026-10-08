"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { productStyle } from "@/components/products/ProductMark";
import type { SceneName } from "./SceneCanvas";

/**
 * A few faint line icons drifting slowly behind the page, chosen for what the
 * page is about: candles and an order book for trading, ID cards and a
 * fingerprint for eKYC, files for DMS, people for the company pages… On a
 * product page they take that product's colour (the page marks it with
 * data-product-key). Very low contrast and slow, never in front of content;
 * still for visitors who prefer reduced motion.
 */

const G: Record<string, string> = {
  candle: "M7 3v4M7 15v6M5 7h4v8H5zM17 2v5M17 13v4M15 7h4v6h-4z",
  depth: "M3 20h18M5 20v-5M9 20V9M13 20v-7M17 20V5M21 20v-9",
  order: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 8h8M8 12h8M8 16h5",
  chart: "M3 20h18M4 16l5-6 4 4 7-9M15 5h5v5",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5",
  phone: "M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2",
  coin: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v4c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 10v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4M4 14v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  bank: "M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  doc: "M6 2h8l4 4v16H6zM14 2v4h4M9 11h6M9 15h6M9 19h4",
  folder: "M3 6h6l2 2h10v11H3zM3 10h18",
  id: "M3 5h18v14H3zM8 9.5a2 2 0 110 .01M5.5 16c.6-2 4.4-2 5 0M13 9h5M13 12h5M13 15h3",
  finger: "M8 21c-1-3-1-6 0-9a4 4 0 018 0c0 2 0 4-1 6M12 12c0 3-.5 6-2 9M16 21c.5-1.5 1-3 1-5M6 17c-.6-2-.7-4 0-6M7 6a7 7 0 0111 3",
  user: "M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c1-4 4.5-6 8-6s7 2 8 6",
  users: "M9 5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM2 20c.8-3.5 3.6-5 7-5s6.2 1.5 7 5M16 5.5a3 3 0 010 6M18 15c2 .5 3.4 2 4 5",
  check: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12.5l3 3 5-6",
  link: "M10 14a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1 1M14 10a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1-1",
  network: "M12 4a2 2 0 110 4 2 2 0 010-4zM5 16a2 2 0 110 4 2 2 0 010-4zM19 16a2 2 0 110 4 2 2 0 010-4zM11 7.5L6 16.5M13 7.5l5 9M7 18h10",
  news: "M4 4h13v16H6a2 2 0 01-2-2zM17 8h3v10a2 2 0 01-2 2M7 8h7M7 12h7M7 16h4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  pin: "M12 21s7-6.5 7-12a7 7 0 00-14 0c0 5.5 7 12 7 12zM12 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z",
  bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4",
  server: "M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01",
};

const PRODUCT_SET: Record<string, string[]> = {
  "trading-platform": ["candle", "depth", "order", "shield", "chart", "server"],
  ost: ["globe", "phone", "candle", "order", "chart", "depth"],
  "smart-stock": ["chart", "candle", "phone", "bell", "depth", "globe"],
  "back-office": ["briefcase", "coin", "doc", "bank", "check", "chart"],
  "bo-account-opening": ["user", "id", "check", "doc", "link", "bank"],
  ekyc: ["id", "finger", "shield", "user", "check", "phone"],
  dms: ["doc", "folder", "shield", "check", "link", "server"],
};
const SCENE_SET: Record<string, string[]> = {
  market: ["candle", "chart", "depth", "globe", "coin", "order"],
  network: ["link", "network", "bank", "users", "globe", "check"],
  people: ["user", "users", "briefcase", "link", "check", "network"],
  wire: ["news", "calendar", "doc", "globe", "chart", "mail"],
  signal: ["mail", "phone", "pin", "globe", "calendar", "link"],
  bokeh: [],
};

/** Spread items evenly but irregularly over the screen (golden-ratio steps). */
function spot(i: number) {
  const x = ((i * 0.618034 + 0.13) % 1) * 92 + 2;
  const y = ((i * 0.381966 + 0.07) % 1) * 88 + 6;
  return { x, y };
}

export function IconDrift({ scene }: { scene: SceneName | "market" }) {
  const pathname = usePathname();
  const [product, setProduct] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setProduct(document.querySelector<HTMLElement>("[data-product-key]")?.dataset.productKey ?? null);
    setCount(window.innerWidth < 640 ? 7 : 14);
  }, [pathname]);
  const set = (product && PRODUCT_SET[product]) || SCENE_SET[scene] || [];
  if (!set.length || !count) return null;
  const color = product ? productStyle(product).to : null;
  return (
    <div className="icon-drift" style={color ? ({ "--drift": color } as CSSProperties) : undefined}>
      {Array.from({ length: count }, (_, i) => {
        const { x, y } = spot(i + 1);
        const size = 22 + ((i * 7) % 4) * 8;
        return (
          <svg
            key={`${product ?? scene}-${i}`}
            viewBox="0 0 24 24"
            className="icon-drift-item"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDuration: `${34 + ((i * 11) % 5) * 6}s`, animationDelay: `-${(i * 5.3) % 30}s` } as CSSProperties}
          >
            <path d={G[set[i % set.length]!]} />
          </svg>
        );
      })}
    </div>
  );
}
