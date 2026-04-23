import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** rounded-2xl (default) or rounded-3xl */
  rounded?: "2xl" | "3xl";
  /** shows the warm coral droplet on the right */
  withCoralDroplet?: boolean;
}

/**
 * LiquidCard — reusable translucent "liquid glass" surface.
 * Applies the same backdrop blur, gradient, gloss highlight and refraction
 * droplets used on the WeekProgress and BottomNav components.
 */
export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ children, className, rounded = "2xl", withCoralDroplet = true, style, ...props }, ref) => {
    const liquidStyle: CSSProperties = {
      background:
        "linear-gradient(180deg, oklch(1 0 0 / 0.55) 0%, oklch(1 0 0 / 0.25) 100%)",
      borderColor: "oklch(1 0 0 / 0.6)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      backdropFilter: "blur(28px) saturate(180%)",
      boxShadow:
        "0 20px 40px -24px color-mix(in oklab, var(--foreground) 22%, transparent), 0 8px 18px -14px color-mix(in oklab, var(--foreground) 14%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.85), inset 0 -1px 0 0 oklch(1 0 0 / 0.18)",
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
        {/* White droplet refraction */}
        <div
          className="pointer-events-none absolute -top-10 -left-6 h-24 w-32 rounded-full opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, oklch(1 0 0 / 0.7) 0%, transparent 70%)",
          }}
        />
        {/* Optional coral droplet */}
        {withCoralDroplet && (
          <div
            className="pointer-events-none absolute -bottom-8 right-4 h-20 w-28 rounded-full opacity-50 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.92 0.05 25 / 0.6) 0%, transparent 70%)",
            }}
          />
        )}
        {/* Glossy top edge highlight */}
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.95), transparent)",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    );
  },
);

LiquidCard.displayName = "LiquidCard";
