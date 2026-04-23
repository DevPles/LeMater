import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rounded?: "2xl" | "3xl";
  /** kept for backward compat — ignored in the clean variant */
  withCoralDroplet?: boolean;
}

/**
 * LiquidCard — clean translucent surface.
 * White frosted background, soft hairline border, gentle shadow.
 */
export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ children, className, rounded = "2xl", style, withCoralDroplet: _ignored, ...props }, ref) => {
    const liquidStyle: CSSProperties = {
      background: "oklch(1 0 0 / 0.72)",
      borderColor: "oklch(0 0 0 / 0.06)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
      backdropFilter: "blur(20px) saturate(160%)",
      boxShadow:
        "0 8px 24px -16px color-mix(in oklab, var(--foreground) 18%, transparent), 0 2px 6px -3px color-mix(in oklab, var(--foreground) 8%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.7)",
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative isolate overflow-hidden border",
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
