/**
 * XFL ecosystem graph: seed data and the filter that decides what is public.
 *
 * This is the source for prisma seed (EcosystemNode / EcosystemEdge / EcosystemFlow).
 * After seeding, the database is the source of truth and admins edit it in the CMS.
 *
 * Rules:
 * - Only XFL-confirmed items are PUBLISHED. Everything else is DRAFT and never rendered publicly.
 * - Edges and flow steps touching a DRAFT node are dropped automatically by getPublishedGraph().
 */

export type Locale = "en" | "bn";
export type Status = "DRAFT" | "PUBLISHED";
export type EcosystemLayer = "MARKET" | "XFL" | "PRODUCT" | "INSTITUTION" | "USER";
export type EdgeKind = "DATA" | "ORDER" | "ONBOARDING" | "RISK" | "OPERATIONS";

/** Text per locale. A missing bn entry means the Bangla version is hidden (site rule). */
export type I18n = Partial<Record<Locale, string>>;

export interface EcosystemNode {
  key: string;
  layer: EcosystemLayer;
  status: Status;
  label: I18n;
  description?: I18n;
  /** Offering.key this node links to (product pages). */
  offeringKey?: string;
  /** Layout hints, 0–1 of the canvas. Mobile uses mobileOrder instead. */
  layoutX?: number;
  layoutY?: number;
  mobileOrder: number;
  /** Internal note for editors. Never rendered. */
  editorNote?: string;
}

export interface EcosystemEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface EcosystemFlowStep {
  /** The edge this step animates, as "from>to". Omit for a step that only highlights a node. */
  edge?: string;
  /** Node highlighted in this step. */
  node: string;
  title: I18n;
  body?: I18n;
}

export interface EcosystemFlow {
  key: string;
  status: Status;
  isPlayback: boolean;
  name: I18n;
  steps: EcosystemFlowStep[];
}

// ---------------------------------------------------------------- nodes

export const ecosystemNodes: EcosystemNode[] = [
  // Market infrastructure
  { key: "dse", layer: "MARKET", status: "PUBLISHED", mobileOrder: 1, layoutX: 0.1, layoutY: 0.3,
    label: { en: "Dhaka Stock Exchange", bn: "ঢাকা স্টক এক্সচেঞ্জ" } },
  { key: "cse", layer: "MARKET", status: "PUBLISHED", mobileOrder: 2, layoutX: 0.1, layoutY: 0.7,
    label: { en: "Chittagong Stock Exchange", bn: "চট্টগ্রাম স্টক এক্সচেঞ্জ" } },
  { key: "cdbl", layer: "MARKET", status: "DRAFT", mobileOrder: 3, layoutX: 0.1, layoutY: 0.9,
    label: { en: "CDBL", bn: "সিডিবিএল" },
    editorNote: "Publish only after XFL confirms how BO Account Opening connects to CDBL." },

  // XFL core
  { key: "xfl", layer: "XFL", status: "PUBLISHED", mobileOrder: 10, layoutX: 0.4, layoutY: 0.5,
    label: { en: "Xpert Fintech", bn: "এক্সপার্ট ফিনটেক" } },

  // Products (confirmed)
  { key: "oms", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "trading-platform", mobileOrder: 20, layoutX: 0.6, layoutY: 0.15,
    label: { en: "OMS", bn: "ওএমএস" },
    description: { en: "Order management for brokerage trading on DSE and CSE.", bn: "ডিএসই ও সিএসইতে ব্রোকারেজ লেনদেনের অর্ডার ব্যবস্থাপনা।" } },
  { key: "rms", layer: "PRODUCT", status: "DRAFT", offeringKey: "rms", mobileOrder: 29, layoutX: 0.6, layoutY: 0.3,
    label: { en: "RMS", bn: "আরএমএস" },
    description: { en: "Risk controls applied to orders before and after they reach the market.", bn: "বাজারে পৌঁছানোর আগে ও পরে অর্ডারে প্রয়োগ করা ঝুঁকি নিয়ন্ত্রণ।" } },
  { key: "dms", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "dms", mobileOrder: 26, layoutX: 0.6, layoutY: 0.45,
    label: { en: "DMS", bn: "ডিএমএস" },
    description: { en: "Controlled storage, access and approval of brokerage documents.", bn: "ব্রোকারেজ নথির নিয়ন্ত্রিত সংরক্ষণ, প্রবেশাধিকার ও অনুমোদন।" } },
  { key: "bo-account-opening", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "bo-account-opening", mobileOrder: 24, layoutX: 0.6, layoutY: 0.6,
    label: { en: "BO Account Opening", bn: "বিও অ্যাকাউন্ট খোলা" },
    description: { en: "Digital application and approval of investor BO accounts.", bn: "বিনিয়োগকারীর বিও অ্যাকাউন্টের ডিজিটাল আবেদন ও অনুমোদন।" } },
  { key: "back-office", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "back-office", mobileOrder: 23, layoutX: 0.6, layoutY: 0.68,
    label: { en: "Back office", bn: "ব্যাক অফিস" },
    description: { en: "Accounts, settlement and reporting for the brokerage back office.", bn: "ব্রোকারেজ ব্যাক অফিসের হিসাব, সেটেলমেন্ট ও রিপোর্টিং।" } },
  { key: "smart-stock", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "smart-stock", mobileOrder: 22, layoutX: 0.6, layoutY: 0.75,
    label: { en: "Smart Stock", bn: "স্মার্ট স্টক" },
    editorNote: "Description pending from XFL. Node shows label only until then." },

  // Products (descriptions pending from XFL)
  { key: "ost", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "ost", mobileOrder: 21, layoutX: 0.6, layoutY: 0.88,
    label: { en: "OST", bn: "ওএসটি" }, editorNote: "Online Share Trading. Description pending from XFL." },
  { key: "ekyc", layer: "PRODUCT", status: "PUBLISHED", offeringKey: "ekyc", mobileOrder: 25, layoutX: 0.5, layoutY: 0.68,
    label: { en: "eKYC", bn: "ই-কেওয়াইসি" }, editorNote: "Pending XFL confirmation." },

  // Institutions
  { key: "brokerages", layer: "INSTITUTION", status: "PUBLISHED", mobileOrder: 30, layoutX: 0.8, layoutY: 0.5,
    label: { en: "Consortium brokerages", bn: "কনসোর্টিয়াম ব্রোকারেজ" } },

  // Users
  { key: "investors", layer: "USER", status: "PUBLISHED", mobileOrder: 40, layoutX: 0.95, layoutY: 0.3,
    label: { en: "Investors", bn: "বিনিয়োগকারী" } },
  { key: "operations", layer: "USER", status: "PUBLISHED", mobileOrder: 41, layoutX: 0.95, layoutY: 0.7,
    label: { en: "Operations & compliance", bn: "অপারেশনস ও কমপ্লায়েন্স" } },
];

// ---------------------------------------------------------------- edges

export const ecosystemEdges: EcosystemEdge[] = [
  { from: "dse", to: "xfl", kind: "DATA" },
  { from: "cse", to: "xfl", kind: "DATA" },
  { from: "xfl", to: "oms", kind: "ORDER" },
  { from: "oms", to: "rms", kind: "RISK" },
  // Orders reach the exchanges from the OMS, which runs the limit checks itself
  // (RMS is no longer shown as a separate product).
  { from: "oms", to: "dse", kind: "ORDER" },
  { from: "oms", to: "cse", kind: "ORDER" },
  { from: "oms", to: "brokerages", kind: "ORDER" },
  { from: "brokerages", to: "investors", kind: "ORDER" },
  { from: "investors", to: "bo-account-opening", kind: "ONBOARDING" },
  { from: "bo-account-opening", to: "ekyc", kind: "ONBOARDING" },
  { from: "ekyc", to: "bo-account-opening", kind: "ONBOARDING" },
  { from: "bo-account-opening", to: "cdbl", kind: "ONBOARDING" },
  { from: "bo-account-opening", to: "dms", kind: "OPERATIONS" },
  { from: "dms", to: "operations", kind: "OPERATIONS" },
  { from: "oms", to: "back-office", kind: "OPERATIONS" },
  { from: "back-office", to: "operations", kind: "OPERATIONS" },
  { from: "xfl", to: "smart-stock", kind: "DATA" },
  { from: "smart-stock", to: "investors", kind: "DATA" },
  { from: "xfl", to: "ost", kind: "DATA" },
  // Investors trade through OST; their orders go on to the OMS.
  { from: "investors", to: "ost", kind: "ORDER" },
  { from: "ost", to: "oms", kind: "ORDER" },
];

// ---------------------------------------------------------------- flows

export const ecosystemFlows: EcosystemFlow[] = [
  {
    key: "order-lifecycle", status: "PUBLISHED", isPlayback: false,
    name: { en: "Order lifecycle", bn: "অর্ডারের ধাপসমূহ" },
    steps: [
      { node: "investors", title: { en: "Investor places an order", bn: "বিনিয়োগকারী অর্ডার দেন" } },
      { node: "ost", edge: "investors>ost", title: { en: "Order placed through OST", bn: "ওএসটি-তে অর্ডার দেওয়া হয়" } },
      { node: "oms", edge: "ost>oms", title: { en: "OMS checks limits and exposure", bn: "ওএমএস লিমিট ও এক্সপোজার যাচাই করে" } },
      { node: "dse", edge: "oms>dse", title: { en: "Order reaches the exchange", bn: "অর্ডার এক্সচেঞ্জে পৌঁছায়" } },
    ],
  },
  {
    key: "onboarding", status: "PUBLISHED", isPlayback: false,
    name: { en: "Investor onboarding", bn: "বিনিয়োগকারী অনবোর্ডিং" },
    steps: [
      { node: "investors", title: { en: "Investor starts an application", bn: "বিনিয়োগকারী আবেদন শুরু করেন" } },
      { node: "bo-account-opening", edge: "investors>bo-account-opening", title: { en: "BO account application", bn: "বিও অ্যাকাউন্টের আবেদন" } },
      { node: "ekyc", edge: "bo-account-opening>ekyc", title: { en: "Identity verification", bn: "পরিচয় যাচাই" } },
      { node: "dms", edge: "bo-account-opening>dms", title: { en: "Documents stored and approved", bn: "নথি সংরক্ষণ ও অনুমোদন" } },
      { node: "brokerages", title: { en: "Account ready to trade", bn: "অ্যাকাউন্ট লেনদেনের জন্য প্রস্তুত" } },
    ],
  },
  {
    key: "explore", status: "PUBLISHED", isPlayback: true,
    name: { en: "Explore the ecosystem", bn: "ইকোসিস্টেম ঘুরে দেখুন" },
    steps: [
      { node: "brokerages", title: { en: "Connect", bn: "সংযোগ" }, body: { en: "Consortium brokerages run on XFL technology.", bn: "কনসোর্টিয়াম ব্রোকারেজগুলো এক্সপার্ট ফিনটেকের প্রযুক্তিতে চলে।" } },
      { node: "bo-account-opening", title: { en: "Onboard", bn: "অনবোর্ড" }, body: { en: "Investors open BO accounts digitally.", bn: "বিনিয়োগকারীরা ডিজিটালি বিও অ্যাকাউন্ট খোলেন।" } },
      { node: "ekyc", title: { en: "Verify", bn: "যাচাই" }, body: { en: "Identity is verified electronically.", bn: "ইলেকট্রনিকভাবে পরিচয় যাচাই করা হয়।" } },
      { node: "oms", title: { en: "Trade", bn: "লেনদেন" }, body: { en: "Orders pass limit and exposure checks in the OMS.", bn: "ওএমএস-এ অর্ডার লিমিট ও এক্সপোজার যাচাই পার হয়।" } },
      { node: "dse", edge: "oms>dse", title: { en: "Connect to market", bn: "বাজারে সংযোগ" }, body: { en: "Orders reach DSE and CSE.", bn: "অর্ডার ডিএসই ও সিএসইতে পৌঁছায়।" } },
      { node: "dms", title: { en: "Operate", bn: "পরিচালনা" }, body: { en: "Documents and approvals are controlled.", bn: "নথি ও অনুমোদন নিয়ন্ত্রিতভাবে পরিচালিত হয়।" } },
      { node: "xfl", title: { en: "Analyse", bn: "বিশ্লেষণ" }, body: { en: "Activity becomes operational insight.", bn: "কার্যক্রম থেকে পরিচালনাগত অন্তর্দৃষ্টি তৈরি হয়।" } },
    ],
  },
];

// ---------------------------------------------------------------- public filter

export interface PublishedGraph {
  nodes: EcosystemNode[];
  edges: EcosystemEdge[];
  flows: EcosystemFlow[];
}

/**
 * Returns only what visitors may see: published nodes, edges whose both ends are
 * published, and published flows with steps referencing unpublished nodes or edges removed.
 * Also strips editor notes, and drops nodes with no label in the requested locale.
 */
export function getPublishedGraph(
  data: { nodes: EcosystemNode[]; edges: EcosystemEdge[]; flows: EcosystemFlow[] },
  locale: Locale,
): PublishedGraph {
  const nodes = data.nodes
    .filter((n) => n.status === "PUBLISHED" && Boolean(n.label[locale]))
    .map((n) => { const copy = { ...n }; delete copy.editorNote; return copy; });
  const visible = new Set(nodes.map((n) => n.key));
  const edges = data.edges.filter((e) => visible.has(e.from) && visible.has(e.to));
  const edgeKeys = new Set(edges.map((e) => `${e.from}>${e.to}`));
  const flows = data.flows
    .filter((f) => f.status === "PUBLISHED" && Boolean(f.name[locale]))
    .map((f) => ({
      ...f,
      steps: f.steps.filter(
        (s) => visible.has(s.node) && (!s.edge || edgeKeys.has(s.edge)) && Boolean(s.title[locale]),
      ),
    }))
    .filter((f) => f.steps.length > 0);
  return { nodes, edges, flows };
}

/** Keys of nodes directly connected to `key` (used for hover highlighting). */
export function neighbours(edges: EcosystemEdge[], key: string): Set<string> {
  const out = new Set<string>();
  for (const e of edges) {
    if (e.from === key) out.add(e.to);
    if (e.to === key) out.add(e.from);
  }
  return out;
}
