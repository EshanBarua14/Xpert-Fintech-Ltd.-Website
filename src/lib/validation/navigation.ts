import { z } from "zod";
import { checkbox, optionalText } from "./common";

/** Paths below the locale: "products/rms", "company/about", "" for home. */
const internalPath = z
  .string()
  .trim()
  .transform((v) => v.replace(/^\/+|\/+$/g, ""))
  .pipe(z.string().max(200).regex(/^[a-z0-9\-/]*$/, "Use lowercase letters, numbers, - and / only, e.g. products/rms"));

export const navItemSchema = z
  .object({
    menuId: z.string().uuid(),
    itemId: z.string().uuid().optional(),
    parentId: z
      .string()
      .uuid()
      .or(z.literal(""))
      .transform((v) => v || null),
    linkType: z.enum(["INTERNAL", "EXTERNAL", "NONE"]),
    internalHref: internalPath,
    externalHref: z.string().trim().max(500),
    enLabel: z.string().trim().min(1, "English label is required.").max(80),
    bnLabel: z.string().trim().max(80),
    enDescription: optionalText(200),
    bnDescription: optionalText(200),
    openInNewTab: checkbox,
    isCta: checkbox,
    isHidden: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.linkType === "EXTERNAL" && !/^https:\/\/\S+$/.test(v.externalHref)) {
      ctx.addIssue({ code: "custom", path: ["externalHref"], message: "Enter a full address starting with https://" });
    }
  });
