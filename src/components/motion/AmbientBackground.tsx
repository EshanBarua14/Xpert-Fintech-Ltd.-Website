"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BourseCanvas } from "./BourseCanvas";
import { SceneCanvas, type SceneName } from "./SceneCanvas";

/**
 * Site-wide backdrop behind all content: soft light from the brand blues and
 * a faint scene drawn from what the page is about (each kind of page has its
 * own; see SceneCanvas and scenes-pages). The home page keeps the trading board.
 */
export function sceneFor(pathname: string): SceneName | "market" {
  const path = pathname.replace(/^\/(en|bn)(?=\/|$)/, "") || "/";
  const is = (re: string) => new RegExp(`^/(${re})(/|$)`).test(path);
  if (is("consortium")) return "network"; // member houses joined into one network
  if (is("platform")) return "pipeline"; // an order's path through the platform
  if (path === "/products") return "modules"; // the product line-up
  if (is("company/about")) return "journey"; // the company's path so far
  if (is("company/board")) return "table"; // one table
  if (is("company/management")) return "orgchart";
  if (is("company/consultants")) return "orbit";
  if (is("company/team")) return "people";
  if (is("careers")) return "code";
  if (is("news")) return "wire";
  if (is("events")) return "spotlight";
  if (is("resources")) return "docs";
  if (is("case-studies|success-stories")) return "growth";
  if (is("gallery")) return "bokeh";
  if (is("contact")) return "signal";
  if (is("request-demo")) return "screens";
  if (is("search")) return "radar";
  return "market";
}

/** Product pages: the scene of what the product does (the page marks its product with data-product-key). */
const PRODUCT_SCENE: Record<string, SceneName | "market"> = {
  "trading-platform": "market",
  rms: "gate",
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
    <div aria-hidden="true" className="ambient" data-scene={scene} data-home={/^\/(en|bn)\/?$/.test(pathname) ? "" : undefined}>
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      {scene === "market" ? <BourseCanvas /> : <SceneCanvas key={scene} scene={scene} />}
    </div>
  );
}
