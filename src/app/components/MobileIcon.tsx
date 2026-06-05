/** Иконка смартфона из макета — фиксированные пропорции, без искажения SVG. */
export function MobileIcon({
  fit = 30,
  stroke = "#6D90FF",
  strokeWidth = 2.5,
  className,
}: {
  fit?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const height = fit;
  const width = fit * (30.25 / 41.5);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30.25 41.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M24.5 2H5.75C3.67893 2 2 3.67893 2 5.75V35.75C2 37.8211 3.67893 39.5 5.75 39.5H24.5C26.5711 39.5 28.25 37.8211 28.25 35.75V5.75C28.25 3.67893 26.5711 2 24.5 2Z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
