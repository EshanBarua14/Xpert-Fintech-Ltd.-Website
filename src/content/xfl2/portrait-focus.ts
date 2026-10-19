/**
 * Where the face is in each portrait in prisma/seed-media/people (fractions of
 * the photo's width and height, about the nose), measured on 15 October 2026
 * and checked by eye; `zoom` brings in faces from photos taken further away.
 * Round avatars, 4:5 cards and the profile window crop around this point.
 * The content seed sets it on those exact files only (matched by checksum);
 * it can be changed per photo in Admin → Media.
 */
export const PORTRAIT_FOCUS: Record<string, { x: number; y: number; zoom?: number }> = {
  "aminul-islam": { x: 0.484, y: 0.378 },
  // Representatives (19 Oct 2026): Wasif Zaman's photo is half-length, so his face is brought in.
  "wasif-zaman": { x: 0.43, y: 0.52, zoom: 1.35 },
  "md-mofizuddin": { x: 0.5, y: 0.46 },
  "asaduzzaman": { x: 0.495, y: 0.44 },
  "bishnu-pada-kunda": { x: 0.537, y: 0.35 },
  "dilip-kajuri": { x: 0.484, y: 0.352, zoom: 1.08 },
  "eshan-barua": { x: 0.49, y: 0.47 },
  "fakruddin-ali-ahmed-rajib": { x: 0.53, y: 0.45 }, // re-framed 15 Oct to head and shoulders like the others (plain background extended above)
  "m-shahryar-faiz": { x: 0.524, y: 0.486 },
  "mahmuda-yasmin-farah": { x: 0.496, y: 0.424, zoom: 1.1 },
  "md-abdur-rahman-rony": { x: 0.49, y: 0.42 }, // new photo 19 Oct 2026
  "md-abul-moshad-chowdhury": { x: 0.531, y: 0.42, zoom: 1.4 },
  "md-hasan-uddin": { x: 0.499, y: 0.463 },
  "md-hefaj-uddin": { x: 0.504, y: 0.467 },
  "md-refat-hossen": { x: 0.52, y: 0.46 },
  "md-shahinur-rahman": { x: 0.5, y: 0.44 }, // new photo 19 Oct 2026
  "md-sirajul-islam": { x: 0.505, y: 0.5 },
  "md-yeasin-hossain": { x: 0.508, y: 0.428, zoom: 1.12 },
  "mohammad-ali": { x: 0.5, y: 0.5 },
  "mohammad-ashiqur-rahman-bhuiyan": { x: 0.52, y: 0.43 },
  "mohammad-erfanul-islam": { x: 0.505, y: 0.491 },
  "mohammad-mehrabul-ferdous": { x: 0.5, y: 0.4 }, // new photo 19 Oct 2026
  "mohammed-rahmat-pasha": { x: 0.52, y: 0.46 },
  "mohd-shaahed-imran": { x: 0.509, y: 0.349, zoom: 1.12 },
  "muhammad-shamsul-maruf": { x: 0.5, y: 0.4 }, // new photo 19 Oct 2026
  "nafis-hasan-khan": { x: 0.506, y: 0.426, zoom: 1.06 },
  "najmul-hasan-rifat": { x: 0.53, y: 0.43 }, // new photo 19 Oct 2026
  "saikat-biswas": { x: 0.5, y: 0.37 }, // new photo 19 Oct 2026
  "shaleh-akram": { x: 0.487, y: 0.56 }, // new photo 19 Oct 2026
  "shamsher-morshed": { x: 0.49, y: 0.43 },
  "sumon-das": { x: 0.501, y: 0.409 },
  "talukder-juhaer-hakim": { x: 0.501, y: 0.434 },
  "toha-hossain": { x: 0.49, y: 0.51 },
};
