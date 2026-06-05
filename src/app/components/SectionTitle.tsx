import { cn } from "../lib/cn";

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[48px] leading-[99.9%] tracking-[-0.5px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
