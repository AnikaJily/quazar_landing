const ARROW_PATH =
  "M0.728756 12.5467C0.286232 12.7712 -0.177741 12.2835 0.0684432 11.8527L3.09874 6.54969C3.18658 6.39597 3.18658 6.20727 3.09874 6.05355L0.0684431 0.750528C-0.177741 0.319705 0.286231 -0.167926 0.728755 0.0565462L12.1612 5.85571C12.5263 6.0409 12.5263 6.56235 12.1612 6.74753L0.728756 12.5467Z";

export function ArrowIcon({ fill = "#030303", size = 12 }: { fill?: string; size?: number }) {
  return (
    <svg
      width={size * (12.4 / 12.6)}
      height={size}
      viewBox="0 0 12.435 12.6032"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path d={ARROW_PATH} fill={fill} />
    </svg>
  );
}
