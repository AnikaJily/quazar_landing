import { SHADER_BEAM } from "../components/kvazarBeam";

/**
 * beamGeometry — линия луча квазара в экранном пространстве starfield.
 *
 * `BEAM` выводится из параметров шейдера (`SHADER_BEAM`) — единый источник,
 * рассинхрон невозможен. Шейдер в uv (y вверх), starfield — экран (y вниз),
 * поэтому cy и y-компонента направления инвертируются (диагональ "/").
 * Радиусы эллипса в `inCore` подобраны на глаз — при смене толщины луча сверить.
 */
const BEAM_RAD = -SHADER_BEAM.angle * 2 * Math.PI; // `radAngle` шейдера
export const BEAM = {
  cx: SHADER_BEAM.cx,
  cy: 1 - SHADER_BEAM.cy, // uv (y вверх) → экран (y вниз)
  dirX: Math.cos(BEAM_RAD),
  dirY: -Math.sin(BEAM_RAD), // y инвертируется вместе со сменой пространства
};

/** Перпендикулярное расстояние (0..~1) от точки до линии луча. */
export function distToBeam(x01: number, y01: number): number {
  const px = x01 - BEAM.cx;
  const py = y01 - BEAM.cy;
  const proj = px * BEAM.dirX + py * BEAM.dirY;
  return Math.hypot(px - proj * BEAM.dirX, py - proj * BEAM.dirY);
}

/** true — внутри яркого центрального эллипса луча (радиусы на глаз). */
export function inCore(x01: number, y01: number): boolean {
  const dx = (x01 - BEAM.cx) / 0.32;
  const dy = (y01 - BEAM.cy) / 0.34;
  return dx * dx + dy * dy < 1;
}
