import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rounded?: "2xl" | "3xl";
  /** Background opacity (0–1). Default 0.85. Use lower values for a more transparent card. */
  bgOpacity?: number;
  /** Optional harmonic tint color (any CSS color). Adds a soft colored wash to the glass. */
  tint?: string;
  /** kept for backward compat — ignored */
  withCoralDroplet?: boolean;
}

/**
 * LiquidCard — clean translucent surface.
 * Performance-optimized: solid translucent background, no backdrop-filter.
 * Looks frosted but doesn't trigger expensive GPU compositing per frame.
 */
export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ children, className, rounded = "2xl", bgOpacity = 0.85, tint, style, withCoralDroplet: _ignored, ...props }, ref) => {
    const top = Math.min(bgOpacity + 0.05, 1);
    const bot = Math.max(bgOpacity - 0.15, 0.1);
    const background = tint
      ? `linear-gradient(135deg, color-mix(in oklab, ${tint} 35%, oklch(1 0 0 / ${top})) 0%, color-mix(in oklab, ${tint} 18%, oklch(1 0 0 / ${bot})) 100%)`
      : `linear-gradient(135deg, oklch(1 0 0 / ${top}) 0%, oklch(1 0 0 / ${bot}) 100%)`;
    const borderColor = tint
      ? `color-mix(in oklab, ${tint} 40%, oklch(1 0 0 / 0.55))`
      : "oklch(1 0 0 / 0.45)";
    const liquidStyle: CSSProperties = {
      background,
      borderColor,
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      boxShadow: tint
        ? `0 8px 32px -12px color-mix(in oklab, ${tint} 35%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--foreground) 10%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.8), inset 0 -1px 0 0 oklch(1 0 0 / 0.2)`
        : "0 8px 32px -12px color-mix(in oklab, var(--foreground) 22%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--foreground) 10%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.8), inset 0 -1px 0 0 oklch(1 0 0 / 0.2)",
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border relative overflow-hidden",
          rounded === "3xl" ? "rounded-3xl" : "rounded-2xl",
          className,
        )}
        style={liquidStyle}
        {...props}
      >
        {/* Glossy highlight sweep */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            background:
              "linear-gradient(180deg, oklch(1 0 0 / 0.35) 0%, oklch(1 0 0 / 0) 100%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1/2 -left-1/4 h-[200%] w-1/3 rotate-12"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.18) 50%, transparent 100%)",
          }}
        />
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  },
);

LiquidCard.displayName = "LiquidCard";
