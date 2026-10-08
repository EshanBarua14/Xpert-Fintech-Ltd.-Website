"use client";

import { usePathname } from "next/navigation";
import { BourseCanvas } from "./BourseCanvas";
import { SceneCanvas, type SceneName } from "./SceneCanvas";
import { IconDrift } from "./IconDrift";

/**
 * Site-wide backdrop behind all content: soft light from the brand blues and
 * a faint scene that matches the page — a trading board for markets and
 * products, a member network for the consortium, a constellation for people,
 * a news wire for insights, soft light for the gallery and a signal for
 * contact pages — with a few faint icons that belong to the page drifting
 * over it (a product page uses its own icons and colour).
 */
export function sceneFor(pathname: string): SceneName | "market" {
  const path = pathname.replace(/^\/(en|bn)(?=\/|$)/, "") || "/";
  if (/^\/(consortium|company\/about)(\/|$)/.test(path)) return "network";
  if (/^\/(company\/(board|management|team)|careers)(\/|$)/.test(path)) return "people";
  if (/^\/(news|events|resources|case-studies)(\/|$)/.test(path)) return "wire";
  if (/^\/gallery(\/|$)/.test(path)) return "bokeh";
  if (/^\/(contact|request-demo)(\/|$)/.test(path)) return "signal";
  return "market";
}

export function AmbientBackground() {
  const scene = sceneFor(usePathname() ?? "/");
  return (
    <div aria-hidden="true" className="ambient" data-scene={scene}>
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      {scene === "market" ? <BourseCanvas /> : <SceneCanvas key={scene} scene={scene} />}
      <IconDrift scene={scene} />
    </div>
  );
}
