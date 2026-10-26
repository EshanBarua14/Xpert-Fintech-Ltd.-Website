/**
 * Engineering roles: people in an engineering department, or with an
 * engineering title in English (engineer, developer, architect, QA, analyst,
 * network or system administrator). Their cards always show the code-profile
 * icon — linked when Admin → People has their GitHub, muted until then.
 */
export function isEngineeringRole(department: string | null | undefined, titleEn: string | null | undefined): boolean {
  const dept = (department ?? "").toLowerCase();
  if (/\b(engineering|infrastructure|development|devops|qa|it)\b/.test(dept)) return true;
  return /\b(engineer|developer|programmer|architect|devops|qa|tester|business analyst|administrator|application support)\b/i.test(titleEn ?? "");
}
