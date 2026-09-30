export const PERSON_GROUPS = ["BOARD", "MANAGEMENT", "LEADERSHIP", "TEAM"] as const;
export type PersonGroupKey = (typeof PERSON_GROUPS)[number];

export const PERSON_GROUP_LABELS: Record<PersonGroupKey, string> = {
  BOARD: "Board of directors",
  MANAGEMENT: "Management committee",
  LEADERSHIP: "Leadership",
  TEAM: "Team",
};
