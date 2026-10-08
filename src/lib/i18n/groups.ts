/**
 * Sections for Admin → Site text, worked out from each key's name so a new
 * string lands in a sensible place without extra bookkeeping.
 */
export const TEXT_GROUPS = [
  "Home",
  "Header, footer and menus",
  "Markets and ticker",
  "Products and platform",
  "Company and people",
  "News, events and gallery",
  "Careers",
  "Forms and contact",
  "Search",
  "Errors and messages",
  "Other",
] as const;
export type TextGroup = (typeof TEXT_GROUPS)[number];

const RULES: [RegExp, TextGroup][] = [
  [/^(allRightsReserved|home|alsoOn|builtInBangladesh)$/, "Header, footer and menus"],
  [/^(addWatch|removeWatch|indicesTitle|dataNotice|up|down|flat|rankOfMovers|previousSession|rankLabel|live|source)$/, "Markets and ticker"],
  [/^(orderFlowTitle|participants|partOf|selectNode|allProducts|name(Bank|Investors|Bsec|Dse|Cse|Cdbl))$/, "Products and platform"],
  [/^(meetConsortium)$/, "Company and people"],
  [/^(allNews|minRead|byAuthor|relatedNews|downloadPdf|openLink|fromEvent|featuredVideo|moreAlbums)$/, "News, events and gallery"],
  [/^(openRoles|viewAndApply|viewJob|allJobs|coverLetter|submitApplication)$/, "Careers"],
  [/^(callUs|bt[A-Z]|cm[A-Z]|pt[A-Z]|orReachUs|talkToUs|officeHours|getDirections|mapTitle)/, "Forms and contact"],
  [/^(hero|proof|reach|clients|showcase|testimonial|principles|p\d|flow|cta|trust|latest|platformEyebrow|platformTitle|platformBody|why)/, "Home"],
  [/^(menu|closeMenu|mainNavigation|nav|footer|language|skip|theme|overview|followUs|address|legal|copyright|brand)/, "Header, footer and menus"],
  [/^(market|ticker|top(Gainers|Losers)|most|col|watch|price|symbol|last|change|turnover|volume|trades|advanced|declined|unchanged|asOf|demoData|sortBy|showing|page|rowsPerPage|noMovers|notPublished|dse|cse|openBoard|quote|xpert|index|breadth|delay|share)/, "Markets and ticker"],
  [/^(oms|eco|cap|product|platform|module|capabilit|integration|architecture|howItWorks|useCases|whoItsFor|security|deployments|faq|demoTitle|demoBody|screens|playVideo|whereItFits|explore|getAndroid|getIos|openWeb|liveApps|theProblem|theSolution|conceptual)/, "Products and platform"],
  [/^(credentials|team|people|board|management|leadership|role|biography|bio|viewProfile|linkedin|emailPerson|placeholder|chairman|md|about|company|mission|vision|ourStory|consortium|members|exchanges|ownedBy|milestones|stat)/, "Company and people"],
  [/^(news|event|gallery|video|album|photo|resources|res|case|cs|read|allEvents|article|category|tag|insight|openPhoto|prevPhoto|nextPhoto)/, "News, events and gallery"],
  [/^(job|career|apply|cv|vacanc|deadline|employment)/, "Careers"],
  [/^(form|demo|thanks|contact|request|consent|security|type|send|name|email|phone|organization|designation|visit|hours|directions)/, "Forms and contact"],
  [/^(search)/, "Search"],
  [/^(err|error|notFound|no|back|tryAgain|close|loading)/, "Errors and messages"],
];

export function groupOf(key: string): TextGroup {
  for (const [re, g] of RULES) if (re.test(key)) return g;
  return "Other";
}

/** {n}, {exchange}… placeholders a translation must keep. */
export function placeholders(text: string): string[] {
  return [...new Set(text.match(/\{[a-zA-Z]+\}/g) ?? [])].sort();
}
