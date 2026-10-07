/** Human labels for enum values, shared by admin and public pages. */
export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Part time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFERED", label: "Offered" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Not selected" },
] as const;

export const RESOURCE_KINDS = [
  { value: "BROCHURE", label: "Brochure" },
  { value: "PRODUCT_SHEET", label: "Product sheet" },
  { value: "WHITEPAPER", label: "White paper" },
  { value: "TECHNICAL_DOCUMENT", label: "Technical document" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "VIDEO", label: "Video" },
  { value: "OTHER", label: "Other" },
] as const;

export const labelOf = (list: readonly { value: string; label: string }[], value: string) => list.find((x) => x.value === value)?.label ?? value;
