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
      background: `oklch(1 0 0 / ${bgOpacity})`,
      borderColor: "oklch(0 0 0 / 0.06)",
      boxShadow:
        "0 6px 18px -12px color-mix(in oklab, var(--foreground) 18%, transparent), 0 1px 3px -1px color-mix(in oklab, var(--foreground) 8%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.7)",
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border",
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
