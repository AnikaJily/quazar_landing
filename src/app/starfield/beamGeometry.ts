import { SHADER_BEAM } from "../components/kvazarBeam";

/**
 * beamGeometry — the quasar beam's line, in the starfield's screen space.
 * ---------------------------------------------------------------------------
 * `BEAM` is DERIVED from the shader's params (`SHADER_BEAM` in
 * `app/components/kvazarBeam.ts`), so it can never drift out of sync: change the
 * beam once there and this follows automatically.
 *
 * The shader works in uv space (y-up); the starfield positions stars in screen
 * space (y-down, `top: y%`). Conversion:
 *   - cx unchanged                       → 0.49556
 *   - cy = 1 - shader.cy                 → 0.51453   (y flips)
 *   - direction from the shader's angle, with its y-component flipped in sign →
 *     the "/" diagonal (bottom-left ↔ top-right), i.e. the beam you actually see.
 *     (An earlier "\" guess silently hugged the WRONG diagonal — see git history.)
 *
 * NOTE: the `inCore` ellipse radii below are still eyeballed, not derived — if
 * you retune the beam's thickness, re-check them.
 *
 * Used by the field generator to (a) keep field stars off the beam when
 * `avoidBeam` is on, and (b) place Pleiades clusters hugging the beam.
 */
const BEAM_RAD = -SHADER_BEAM.angle * 2 * Math.PI; // shader's `radAngle`
export const BEAM = {
  cx: SHADER_BEAM.cx,
  cy: 1 - SHADER_BEAM.cy, // uv y-up → screen y-down
  dirX: Math.cos(BEAM_RAD),
  dirY: -Math.sin(BEAM_RAD), // y flips with the coordinate space
};

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
