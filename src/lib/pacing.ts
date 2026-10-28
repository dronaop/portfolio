/**
 * Scroll pacing for pinned scenes, written in vh: screen-heights of scroll
 * (100 = one screen). Readers scroll at their own steady speed, so how long
 * a beat stays on screen is set by how much scroll it is given, not by
 * fractions of a section. A line meant to be read holds for about one
 * screen of scroll (~80–100vh); a move between beats takes 30–70.
 *
 * `length` is the scene's pinned scroll in vh. The section is one screen
 * taller than that, for the pinned screen itself.
 */
export function pacing(length: number) {
  const at = (vh: number) => vh / length;
  return {
    /** The section's CSS height. */
    height: `${length + 100}vh`,
    /** Pinned progress (0..1) this many vh into the scene. */
    at,
    /** Pinned progress range for [start, end] vh. */
    span: (start: number, end: number): [number, number] => [at(start), at(end)],
  };
}
