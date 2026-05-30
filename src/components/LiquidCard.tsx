import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rounded?: "2xl" | "3xl";
  /** Background opacity (0–1). Default 0.85. Use lower values for a more transparent card. */
  bgOpacity?: number;
  /** kept for backward compat — ignored */
  withCoralDroplet?: boolean;
}

/**
 * LiquidCard — clean translucent surface.
 * Performance-optimized: solid translucent background, no backdrop-filter.
 * Looks frosted but doesn't trigger expensive GPU compositing per frame.
 */
export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ children, className, rounded = "2xl", bgOpacity = 0.85, style, withCoralDroplet: _ignored, ...props }, ref) => {
    const liquidStyle: CSSProperties = {
      background: `linear-gradient(135deg, oklch(1 0 0 / ${Math.min(bgOpacity + 0.05, 1)}) 0%, oklch(1 0 0 / ${Math.max(bgOpacity - 0.15, 0.1)}) 100%)`,
      borderColor: "oklch(1 0 0 / 0.45)",
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      boxShadow:
        "0 8px 32px -12px color-mix(in oklab, var(--foreground) 22%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--foreground) 10%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.8), inset 0 -1px 0 0 oklch(1 0 0 / 0.2)",
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
        {children}
      </div>
    );
  },
);

LiquidCard.displayName = "LiquidCard";
