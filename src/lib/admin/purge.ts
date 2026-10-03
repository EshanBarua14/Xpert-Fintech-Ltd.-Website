import "server-only";
import { db } from "@/lib/db/client";
import { storage } from "@/lib/storage";
import { clearMediaUsage } from "@/lib/admin/media";

/**
 * Permanent deletion, used both by the "Delete permanently" buttons and by
 * the automatic trash clean-up. Each function also removes links that point
 * to the record, so nothing is left dangling. Callers check permissions.
 */

export async function purgePage(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "PAGE", id);
    await tx.seoMetadata.deleteMany({ where: { entityType: "PAGE", entityId: id } });
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "PAGE", fromId: id }, { toType: "PAGE", toId: id }] } });
    await tx.solution.updateMany({ where: { pageId: id }, data: { pageId: null } });
    await tx.page.delete({ where: { id } });
  });
}

export async function purgeOffering(id: string) {
  await db.$transaction([
    db.deployment.updateMany({ where: { offeringId: id }, data: { offeringId: null } }),
    db.lead.updateMany({ where: { interestedOfferingId: id }, data: { interestedOfferingId: null } }),
    db.offering.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    db.contentRelation.deleteMany({ where: { OR: [{ fromType: "OFFERING", fromId: id }, { toType: "OFFERING", toId: id }] } }),
    db.seoMetadata.deleteMany({ where: { entityType: "OFFERING", entityId: id } }),
    db.offering.delete({ where: { id } }),
  ]);
}

export async function purgeEvent(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "EVENT", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "EVENT", fromId: id }, { toType: "EVENT", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "EVENT", entityId: id } });
    await tx.event.delete({ where: { id } });
  });
}

export async function purgePerson(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "PERSON", id);
    await tx.seoMetadata.deleteMany({ where: { entityType: "PERSON", entityId: id } });
    await tx.person.delete({ where: { id } });
  });
}

export async function purgeOrganization(id: string) {
  await db.$transaction(async (tx) => {
    await tx.deployment.updateMany({ where: { organizationId: id }, data: { organizationId: null } });
    await tx.testimonial.updateMany({ where: { organizationId: id }, data: { organizationId: null } });
    await clearMediaUsage(tx, "ORGANIZATION", id);
    await tx.contentRelation.deleteMany({
      where: { OR: [{ fromType: "ORGANIZATION", fromId: id }, { toType: "ORGANIZATION", toId: id }] },
    });
    await tx.organization.delete({ where: { id } });
  });
}

export async function purgeDeployment(id: string) {
  await db.$transaction([
    db.contentRelation.deleteMany({ where: { OR: [{ fromType: "DEPLOYMENT", fromId: id }, { toType: "DEPLOYMENT", toId: id }] } }),
    db.deployment.delete({ where: { id } }),
  ]);
}

export async function purgeArticle(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "ARTICLE", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "ARTICLE", fromId: id }, { toType: "ARTICLE", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "ARTICLE", entityId: id } });
    await tx.article.delete({ where: { id } });
  });
}

/** Deletes a job and its applications (and the applicants' CV files). */
export async function purgeCareer(id: string) {
  const apps = await db.careerApplication.findMany({ where: { careerId: id }, select: { id: true } });
  for (const a of apps) await purgeApplication(a.id);
  await db.$transaction(async (tx) => {
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "CAREER", fromId: id }, { toType: "CAREER", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "CAREER", entityId: id } });
    await tx.career.delete({ where: { id } });
  });
}

/** Deletes an application and its CV file, so personal data does not linger. */
export async function purgeApplication(id: string) {
  const app = await db.careerApplication.findUnique({ where: { id }, select: { cvMediaId: true } });
  if (!app) return;
  await db.careerApplication.delete({ where: { id } });
  if (app.cvMediaId) {
    const media = await db.media.findUnique({ where: { id: app.cvMediaId } });
    if (media) {
      await db.mediaUsage.deleteMany({ where: { mediaId: media.id } });
      await db.media.delete({ where: { id: media.id } });
      await storage().remove(media.storageKey).catch((error: unknown) => console.error("[purge] could not remove CV", error));
    }
  }
}

export async function purgeResource(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "RESOURCE", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "RESOURCE", fromId: id }, { toType: "RESOURCE", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "RESOURCE", entityId: id } });
    await tx.resource.delete({ where: { id } });
  });
}

export async function purgeCaseStudy(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "CASE_STUDY", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "CASE_STUDY", fromId: id }, { toType: "CASE_STUDY", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "CASE_STUDY", entityId: id } });
    await tx.caseStudy.delete({ where: { id } });
  });
}

export async function purgeAlbum(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "ALBUM", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "ALBUM", fromId: id }, { toType: "ALBUM", toId: id }] } });
    await tx.seoMetadata.deleteMany({ where: { entityType: "ALBUM", entityId: id } });
    await tx.album.delete({ where: { id } });
  });
}

export async function purgeVideo(id: string) {
  await db.$transaction(async (tx) => {
    await clearMediaUsage(tx, "VIDEO", id);
    await tx.contentRelation.deleteMany({ where: { OR: [{ fromType: "VIDEO", fromId: id }, { toType: "VIDEO", toId: id }] } });
    await tx.video.delete({ where: { id } });
  });
}

export async function purgeLead(id: string) {
  await db.lead.delete({ where: { id } });
}

/** Deletes a media file and its stored bytes. Returns false if it is still in use. */
export async function purgeMedia(id: string): Promise<boolean> {
  const media = await db.media.findUnique({ where: { id }, include: { _count: { select: { usages: true } } } });
  if (!media || media._count.usages > 0) return false;
  await db.media.delete({ where: { id } });
  await storage()
    .remove(media.storageKey)
    .catch((error: unknown) => console.error("[purge] could not remove stored file", media.storageKey, error));
  return true;
}

export const TRASH_RETENTION_DAYS = 30;
const RUN_EVERY_MS = 6 * 60 * 60 * 1000;
let lastRun = 0;
let running = false;

/**
 * Empties items that have been in the trash for more than 30 days, and drops
 * expired admin sessions. Runs at most every 6 hours, started from the admin
 * area, so no separate scheduler is needed. Errors are logged, never shown.
 */
export async function purgeOldTrash(force = false): Promise<number> {
  if (running || (!force && Date.now() - lastRun < RUN_EVERY_MS)) return 0;
  running = true;
  lastRun = Date.now();
  let removed = 0;
  const before = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const old = { deletedAt: { lt: before } };
  const run = async (ids: { id: string }[], purge: (id: string) => Promise<unknown>) => {
    for (const { id } of ids) {
      try {
        if ((await purge(id)) !== false) removed++;
      } catch (error) {
        console.error("[purge] could not delete", id, error);
      }
    }
  };

  try {
    // Records first, so the media files they used become free to delete.
    await run(await db.lead.findMany({ where: old, select: { id: true } }), purgeLead);
    await run(await db.deployment.findMany({ where: old, select: { id: true } }), purgeDeployment);
    await run(await db.event.findMany({ where: old, select: { id: true } }), purgeEvent);
    await run(await db.article.findMany({ where: old, select: { id: true } }), purgeArticle);
    await run(await db.careerApplication.findMany({ where: old, select: { id: true } }), purgeApplication);
    await run(await db.career.findMany({ where: old, select: { id: true } }), purgeCareer);
    await run(await db.resource.findMany({ where: old, select: { id: true } }), purgeResource);
    await run(await db.caseStudy.findMany({ where: old, select: { id: true } }), purgeCaseStudy);
    await run(await db.album.findMany({ where: old, select: { id: true } }), purgeAlbum);
    await run(await db.video.findMany({ where: old, select: { id: true } }), purgeVideo);
    await run(await db.person.findMany({ where: old, select: { id: true } }), purgePerson);
    await run(await db.offering.findMany({ where: old, select: { id: true } }), purgeOffering);
    await run(await db.organization.findMany({ where: old, select: { id: true } }), purgeOrganization);
    // System pages (home, contact…) are never deleted.
    await run(await db.page.findMany({ where: { ...old, key: null }, select: { id: true } }), purgePage);
    await run(await db.media.findMany({ where: old, select: { id: true } }), purgeMedia);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.session.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: dayAgo } }] } });
    if (removed) console.info(`[purge] removed ${removed} item(s) older than ${TRASH_RETENTION_DAYS} days from the trash`);
  } catch (error) {
    console.error("[purge] trash clean-up failed", error);
  } finally {
    running = false;
  }
  return removed;
}
