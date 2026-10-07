"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { checkbox, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type EcoState = { errors?: FieldErrors; message?: string; ok?: boolean };

const refresh = () => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/ecosystem");
};
const keyField = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens, e.g. smart-stock.").max(60);
const LAYERS = ["MARKET", "XFL", "PRODUCT", "INSTITUTION", "USER"] as const;
const KINDS = ["DATA", "ORDER", "ONBOARDING", "RISK", "OPERATIONS"] as const;

const nodeSchema = z.object({
  id: z.string().optional(),
  key: keyField,
  layer: z.enum(LAYERS),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  offeringId: z.string().uuid().or(z.literal("")).transform((v) => v || null),
  mobileOrder: z.coerce.number().int().min(0).max(999),
  editorNote: optionalText(500),
  enLabel: z.string().trim().min(1, "English label is required.").max(80),
  enDescription: optionalText(300),
  enCta: optionalText(40),
  bnLabel: z.string().trim().max(80),
  bnDescription: optionalText(300),
  bnCta: optionalText(40),
});

export async function saveNode(_prev: EcoState, formData: FormData): Promise<EcoState> {
  const admin = await requireAdmin();
  const parsed = nodeSchema.safeParse(Object.fromEntries(Object.keys(nodeSchema.shape).map((k) => [k, formData.get(k) ?? (k === "id" || k === "publishAt" ? undefined : "")])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const clash = await db.ecosystemNode.findUnique({ where: { key: v.key } });
  if (clash && clash.id !== v.id) return { errors: { key: "Another node already uses this key." }, message: "Please fix the highlighted fields." };
  const data = {
    key: v.key,
    layer: v.layer,
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    offeringId: v.offeringId,
    mobileOrder: v.mobileOrder,
    editorNote: v.editorNote ?? null,
    updatedById: admin.id,
  };
  const text = (l: "en" | "bn") => ({
    label: l === "en" ? v.enLabel : v.bnLabel,
    description: (l === "en" ? v.enDescription : v.bnDescription) ?? null,
    ctaLabel: (l === "en" ? v.enCta : v.bnCta) ?? null,
  });
  let id = v.id;
  await db.$transaction(async (tx) => {
    if (id) await tx.ecosystemNode.update({ where: { id }, data });
    else id = (await tx.ecosystemNode.create({ data: { ...data, createdById: admin.id } })).id;
    const nodeId = id!;
    await tx.ecosystemNodeTranslation.upsert({ where: { nodeId_locale: { nodeId, locale: "en" } }, update: text("en"), create: { nodeId, locale: "en", ...text("en") } });
    if (v.bnLabel) await tx.ecosystemNodeTranslation.upsert({ where: { nodeId_locale: { nodeId, locale: "bn" } }, update: text("bn"), create: { nodeId, locale: "bn", ...text("bn") } });
    else await tx.ecosystemNodeTranslation.deleteMany({ where: { nodeId, locale: "bn" } });
  });
  refresh();
  redirect(`/admin/ecosystem/nodes/${id}?saved=1`);
}

export async function deleteNode(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  // Its links and flow steps go with it (cascade).
  await db.ecosystemNode.delete({ where: { id } });
  refresh();
  redirect("/admin/ecosystem?deleted=1");
}

const edgeSchema = z.object({
  nodeId: z.string().min(1),
  otherId: z.string().min(1, "Choose a node."),
  direction: z.enum(["out", "in"]),
  kind: z.enum(KINDS),
});

export async function addEdge(_prev: EcoState, formData: FormData): Promise<EcoState> {
  await requireAdmin();
  const parsed = edgeSchema.safeParse(Object.fromEntries(Object.keys(edgeSchema.shape).map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (v.otherId === v.nodeId) return { errors: { otherId: "A node cannot link to itself." } };
  const [fromNodeId, toNodeId] = v.direction === "out" ? [v.nodeId, v.otherId] : [v.otherId, v.nodeId];
  if (await db.ecosystemEdge.findFirst({ where: { fromNodeId, toNodeId, kind: v.kind } })) return { errors: { otherId: "That link already exists." } };
  const max = await db.ecosystemEdge.aggregate({ _max: { sortOrder: true } });
  await db.ecosystemEdge.create({ data: { fromNodeId, toNodeId, kind: v.kind, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  refresh();
  revalidatePath(`/admin/ecosystem/nodes/${v.nodeId}`);
  return { ok: true, message: "Link added." };
}

export async function deleteEdge(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const nodeId = z.string().min(1).parse(formData.get("nodeId"));
  await db.ecosystemEdge.delete({ where: { id } }).catch(() => null);
  refresh();
  redirect(`/admin/ecosystem/nodes/${nodeId}`);
}

const stepSchema = z.object({
  nodeId: z.string().min(1),
  enTitle: z.string().trim().min(1).max(80),
  enBody: z.string().trim().max(300).optional().default(""),
  bnTitle: z.string().trim().max(80).optional().default(""),
  bnBody: z.string().trim().max(300).optional().default(""),
});

const flowSchema = z.object({
  id: z.string().optional(),
  key: keyField,
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  isPlayback: checkbox,
  enName: z.string().trim().min(1, "English name is required.").max(80),
  bnName: z.string().trim().max(80),
  steps: z.string(),
});

export async function saveFlow(_prev: EcoState, formData: FormData): Promise<EcoState> {
  const admin = await requireAdmin();
  const parsed = flowSchema.safeParse(Object.fromEntries(Object.keys(flowSchema.shape).map((k) => [k, formData.get(k) ?? (k === "id" || k === "publishAt" ? undefined : "")])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  let steps: z.infer<typeof stepSchema>[];
  try {
    steps = z.array(stepSchema).max(20).parse(JSON.parse(v.steps));
  } catch {
    return { errors: { steps: "Every step needs a node and an English title." }, message: "Please fix the highlighted fields." };
  }
  if (!steps.length) return { errors: { steps: "Add at least one step." }, message: "Please fix the highlighted fields." };
  const clash = await db.ecosystemFlow.findUnique({ where: { key: v.key } });
  if (clash && clash.id !== v.id) return { errors: { key: "Another flow already uses this key." }, message: "Please fix the highlighted fields." };
  const nodeIds = await db.ecosystemNode.findMany({ where: { id: { in: steps.map((s) => s.nodeId) } }, select: { id: true } });
  if (new Set(nodeIds.map((n) => n.id)).size !== new Set(steps.map((s) => s.nodeId)).size) return { errors: { steps: "A step points to a node that no longer exists." } };

  const data = { key: v.key, status: v.status, publishAt: parseLocalDateTime(v.publishAt), isPlayback: v.isPlayback, updatedById: admin.id };
  let id = v.id;
  await db.$transaction(async (tx) => {
    // Only one flow is the guided tour.
    if (v.isPlayback) await tx.ecosystemFlow.updateMany({ where: { isPlayback: true, ...(id && { id: { not: id } }) }, data: { isPlayback: false } });
    if (id) await tx.ecosystemFlow.update({ where: { id }, data });
    else id = (await tx.ecosystemFlow.create({ data: { ...data, createdById: admin.id } })).id;
    const flowId = id!;
    await tx.ecosystemFlowTranslation.upsert({ where: { flowId_locale: { flowId, locale: "en" } }, update: { name: v.enName }, create: { flowId, locale: "en", name: v.enName } });
    if (v.bnName) await tx.ecosystemFlowTranslation.upsert({ where: { flowId_locale: { flowId, locale: "bn" } }, update: { name: v.bnName }, create: { flowId, locale: "bn", name: v.bnName } });
    else await tx.ecosystemFlowTranslation.deleteMany({ where: { flowId, locale: "bn" } });
    // Steps are replaced as a whole, in the order shown in the editor.
    await tx.ecosystemFlowStep.deleteMany({ where: { flowId } });
    for (const [i, s] of steps.entries()) {
      await tx.ecosystemFlowStep.create({
        data: {
          flowId,
          nodeId: s.nodeId,
          sortOrder: i,
          translations: {
            create: [
              { locale: "en", title: s.enTitle, body: s.enBody || null },
              ...(s.bnTitle ? [{ locale: "bn" as const, title: s.bnTitle, body: s.bnBody || null }] : []),
            ],
          },
        },
      });
    }
  });
  refresh();
  redirect(`/admin/ecosystem/flows/${id}?saved=1`);
}

export async function deleteFlow(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await db.ecosystemFlow.delete({ where: { id } });
  refresh();
  redirect("/admin/ecosystem?deleted=1");
}
