import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "outline" | "muted"

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-foreground text-background",
  outline: "border border-border text-foreground",
  muted: "bg-muted text-muted-foreground",
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
)

Badge.displayName = "Badge"
