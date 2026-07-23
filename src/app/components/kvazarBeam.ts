/**
 * SHADER_BEAM — the single source of truth for the quasar beam's line.
 * ---------------------------------------------------------------------------
 * These are the raw params of the beam drawn by the WebGL shader (`drawLine`
 * inside FS_BEAM in `KvazarShader.tsx`). BOTH sides read them from here:
 *   - `KvazarShader.tsx` interpolates them straight into the GLSL string;
 *   - `starfield/beamGeometry.ts` derives its screen-space `BEAM` from them,
 *     so the starfield keeps its stars off the beam automatically.
 *
 * Change the beam's position or angle? Edit it ONCE here — the shader and the
 * starfield's keep-out both follow. (Previously these numbers were copied by
 * hand into two places and drifted silently.)
 */
export const SHADER_BEAM = {
  cx: 0.49556, // center x, in uv space (0..1)
  cy: 0.48547, // center y, in uv space (y-up)
  scale: 0.542, // beam length/falloff
  angle: -0.1269, // rotation, in turns (× 2π = radians)
};
