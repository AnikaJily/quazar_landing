/**
 * beamGeometry — the quasar beam's line, in the starfield's screen space.
 * ---------------------------------------------------------------------------
 * ⚠️ FRAGILE COUPLING. These numbers are HAND-DERIVED from the WebGL shader that
 * draws the visible beam, in `app/components/KvazarShader.tsx` (FS_BEAM):
 *
 *     drawLine(uv, vec2(0.49556, 0.48547), 0.542, -0.1269, ...)
 *                    └ center (uv) ┘              └ angle (turns)
 *
 * The shader works in uv space (y-up); the starfield positions stars in screen
 * space (y-down, `top: y%`). Conversion:
 *   - cx unchanged            → 0.49556
 *   - cy = 1 - 0.48547        → 0.51453   (y flips)
 *   - direction y-component flips sign → the "/" diagonal (bottom-left ↔ top-right),
 *     i.e. the beam you actually see. (An earlier "\" guess silently hugged the
 *     WRONG diagonal — see git history.)
 *
 * MAINTENANCE RULE: if you change the shader's beam center or angle, you MUST
 * re-derive BEAM here (and re-check the inCore ellipse radii below). Nothing
 * enforces the link — a mismatch just drifts stars onto the beam.
 *
 * Used by the field generator to (a) keep field stars off the beam when
 * `avoidBeam` is on, and (b) place Pleiades clusters hugging the beam.
 */
export const BEAM = { cx: 0.49556, cy: 0.51453, dirX: 0.6986, dirY: -0.7155 };

/** Perpendicular distance (0..~1) from a point to the beam line. */
export function distToBeam(x01: number, y01: number): number {
  const px = x01 - BEAM.cx;
  const py = y01 - BEAM.cy;
  const proj = px * BEAM.dirX + py * BEAM.dirY;
  return Math.hypot(px - proj * BEAM.dirX, py - proj * BEAM.dirY);
}

/** True inside the beam's bright central core ellipse (radii tuned by eye). */
export function inCore(x01: number, y01: number): boolean {
  const dx = (x01 - BEAM.cx) / 0.32;
  const dy = (y01 - BEAM.cy) / 0.34;
  return dx * dx + dy * dy < 1;
}
