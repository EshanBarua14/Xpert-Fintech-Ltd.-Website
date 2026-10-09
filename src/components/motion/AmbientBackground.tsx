"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BourseCanvas } from "./BourseCanvas";
import { SceneCanvas, type SceneName } from "./SceneCanvas";

/**
 * Site-wide backdrop behind all content: soft light from the brand blues and
 * a faint scene that matches the page — a trading board for markets and the
 * trading products, a ledger for the back office, document sheets for DMS,
 * ID cards being verified for eKYC and account opening, a member network for
 * the consortium, a constellation for people, a news wire for insights, soft
 * light for the gallery and a signal for contact pages.
 */
export function sceneFor(pathname: string): SceneName | "market" {
  const path = pathname.replace(/^\/(en|bn)(?=\/|$)/, "") || "/";
  if (/^\/(consortium|company\/about|platform)(\/|$)/.test(path)) return "network";
  if (/^\/(company\/(board|management|team|consultants)|careers)(\/|$)/.test(path)) return "people";
  if (/^\/(news|events|resources|case-studies)(\/|$)/.test(path)) return "wire";
  if (/^\/gallery(\/|$)/.test(path)) return "bokeh";
  if (/^\/(contact|request-demo)(\/|$)/.test(path)) return "signal";
  return "market";
}

/** Product pages: the scene of what the product does (the page marks its product with data-product-key). */
const PRODUCT_SCENE: Record<string, SceneName | "market"> = {
  "trading-platform": "market",
  ost: "market",
  "smart-stock": "market",
  "back-office": "ledger",
  dms: "docs",
  ekyc: "identity",
  "bo-account-opening": "identity",
};

export function AmbientBackground() {
  const pathname = usePathname() ?? "/";
  const [product, setProduct] = useState<string | null>(null);
  useEffect(() => {
    setProduct(document.querySelector<HTMLElement>("[data-product-key]")?.dataset.productKey ?? null);
  }, [pathname]);
  const scene = (product && PRODUCT_SCENE[product]) || sceneFor(pathname);
  return (
    <div aria-hidden="true" className="ambient" data-scene={scene}>
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      {scene === "market" ? <BourseCanvas /> : <SceneCanvas key={scene} scene={scene} />}
    </div>
  );
}
