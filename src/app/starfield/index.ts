// Public API of the starfield module. Import from "../starfield" — internals
// (buildField, placeCenters, mulberry32, beamGeometry, StarfieldTuner GROUPS)
// stay private.
export { Starfield } from "./Starfield";
export type { StarfieldProps } from "./Starfield";
export { StarfieldTuner } from "./StarfieldTuner";
export {
  StarfieldConfigProvider,
  useStarfieldConfig,
  isTuning,
  DEFAULT_STARFIELD_CONFIG,
  FOOTER_STARFIELD_CONFIG,
} from "./starfieldConfig";
export type { StarfieldConfig } from "./starfieldConfig";
