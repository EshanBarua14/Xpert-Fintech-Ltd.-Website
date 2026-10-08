import "server-only";
import { db } from "@/lib/db/client";

/** Admin → Testimonials → "Slide speed": seconds each review position stays before the slider moves on. */
export const REVIEW_SPEED_KEY = "reviews.slideSeconds";
export const REVIEW_SPEED_CHOICES = [3, 4, 5, 6, 8, 10] as const;
export const DEFAULT_REVIEW_SECONDS = 4;

export async function getReviewSeconds(): Promise<number> {
  const row = await db.siteSetting.findUnique({ where: { key: REVIEW_SPEED_KEY } }).catch(() => null);
  const v = Number((row?.value as { seconds?: unknown } | null)?.seconds);
  return (REVIEW_SPEED_CHOICES as readonly number[]).includes(v) ? v : DEFAULT_REVIEW_SECONDS;
}
