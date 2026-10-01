import { BourseCanvas } from "./BourseCanvas";

/**
 * Site-wide backdrop behind all content: soft light from the brand blues and
 * a faint trading board of DSE / CSE codes (see BourseCanvas).
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <BourseCanvas />
    </div>
  );
}
