import type { PrismaClient } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Once: shows RMS (the OMS's built-in risk checks) as a published ecosystem node,
 * adds an RMS step after the OMS in the two order flows, and spells out the
 * checks in the OMS texts. Flows edited in Admin are left alone.
 */
export async function seedRmsVisible(db: PrismaClient, EN: any, BN: any) {
  const MARK = "seed.rms-visible-2026-10-12";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;

  const nodes = new Map((await db.ecosystemNode.findMany({ select: { id: true, key: true } })).map((n) => [n.key, n.id] as const));
  const rms = nodes.get("rms");
  const oms = nodes.get("oms");
  const dse = nodes.get("dse");
  if (!rms || !oms) return;

  const LIST_EN = "short-sell prevention, buying power and margin limit, order value and quantity limits, price band checks, exposure caps and blocked BO accounts";
  const LIST_BN = "শর্ট সেল প্রতিরোধ, ক্রয়ক্ষমতা ও মার্জিন সীমা, অর্ডারের মূল্য ও পরিমাণের সীমা, প্রাইস ব্যান্ড যাচাই, এক্সপোজার সীমা এবং ব্লকড বিও অ্যাকাউন্ট";

  await db.ecosystemNode.update({
    where: { key: "rms" },
    data: {
      status: "PUBLISHED",
      offeringId: null,
      translations: {
        updateMany: [
          { where: { locale: EN }, data: { description: "Built into the OMS. Every order is checked before it reaches the exchange: " + LIST_EN + "." } },
          { where: { locale: BN }, data: { description: "ওএমএস-এর ভেতরেই যুক্ত। এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডারে যাচাই হয়: " + LIST_BN + "।" } },
        ],
      },
    },
  });

  const edge = async (from: string, to: string, kind: "RISK" | "ORDER") => {
    const a = nodes.get(from);
    const b = nodes.get(to);
    if (!a || !b) return null;
    const ex = await db.ecosystemEdge.findFirst({ where: { fromNodeId: a, toNodeId: b } });
    if (ex) return ex.id;
    return (await db.ecosystemEdge.create({ data: { fromNodeId: a, toNodeId: b, kind, sortOrder: 90 } })).id;
  };
  const omsRms = await edge("oms", "rms", "RISK");
  const rmsDse = await edge("rms", "dse", "ORDER");
  await edge("rms", "cse", "ORDER");

  let flows = 0;
  for (const key of ["order-lifecycle", "explore"]) {
    const flow = await db.ecosystemFlow.findUnique({ where: { key } });
    if (!flow || flow.updatedById) continue;
    const steps = await db.ecosystemFlowStep.findMany({ where: { flowId: flow.id }, orderBy: { sortOrder: "asc" } });
    if (steps.some((s) => s.nodeId === rms)) continue;
    const at = steps.findIndex((s) => s.nodeId === oms);
    if (at < 0) continue;
    for (const s of steps.slice(at + 1).reverse()) {
      await db.ecosystemFlowStep.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder + 1, ...(s.nodeId === dse && rmsDse ? { edgeId: rmsDse } : {}) },
      });
    }
    await db.ecosystemFlowStep.create({
      data: {
        flowId: flow.id,
        nodeId: rms,
        edgeId: omsRms,
        sortOrder: steps[at]!.sortOrder + 1,
        translations: {
          create: [
            { locale: EN, title: "RMS checks the order", body: "Before the order leaves the brokerage: " + LIST_EN + "." },
            { locale: BN, title: "আরএমএস অর্ডার যাচাই করে", body: "অর্ডার ব্রোকারেজ থেকে বের হওয়ার আগে: " + LIST_BN + "।" },
          ],
        },
      },
    });
    flows++;
  }

  const TEXTS: [string, string][] = [
    ["The OMS checks the order against the brokerage's limits and exposure before it leaves.", "Risk management (RMS) is built into the OMS. Before an order leaves the brokerage it is checked for: " + LIST_EN + "."],
    ["অর্ডার বের হওয়ার আগে ওএমএস ব্রোকারেজের নির্ধারিত সীমা ও এক্সপোজারের সঙ্গে তা যাচাই করে।", "ঝুঁকি ব্যবস্থাপনা (আরএমএস) ওএমএস-এর ভেতরেই যুক্ত। অর্ডার ব্রোকারেজ থেকে বের হওয়ার আগে যাচাই হয়: " + LIST_BN + "।"],
    ["Pre-trade limit and exposure checks built into the OMS.", "Built-in pre-trade risk checks: " + LIST_EN + "."],
    ["ওএমএস-এর ভেতরেই লেনদেনের আগে সীমা ও এক্সপোজার যাচাই।", "ওএমএস-এর ভেতরেই লেনদেনের আগে ঝুঁকি যাচাই: " + LIST_BN + "।"],
    ["Every order passes limit and exposure checks before reaching the exchange.", "Every order passes RMS checks before reaching the exchange: " + LIST_EN + "."],
    ["এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার সীমা ও এক্সপোজার যাচাই পার হয়।", "এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার আরএমএস যাচাই পার হয়: " + LIST_BN + "।"],
  ];
  let texts = 0;
  for (const [from, to] of TEXTS) {
    texts += (await db.offeringItemTranslation.updateMany({ where: { body: from }, data: { body: to } })).count;
  }

  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• RMS shown on the ecosystem map: " + flows + " flow(s) now step through it, " + texts + " OMS text(s) updated");
}
