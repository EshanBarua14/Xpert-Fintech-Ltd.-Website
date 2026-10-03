/**
 * The Xpert modules on the ecosystem ring. Kept out of EcosystemMap.tsx
 * (a client component) so server components can use the list too: values
 * exported from a "use client" file reach the server only as references.
 */
export type EcosystemModuleKey = "RMS" | "OMS" | "BO" | "Back office" | "eKYC" | "DMS";
export const ECOSYSTEM_MODULES: EcosystemModuleKey[] = ["RMS", "OMS", "BO", "Back office", "eKYC", "DMS"];
