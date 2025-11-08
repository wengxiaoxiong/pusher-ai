import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "outline" | "ghost"
type ButtonSize = "default" | "sm" | "lg"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground/40 disabled:text-background/70",
  outline:
    "border border-border bg-background text-foreground hover:bg-foreground/5 disabled:text-muted-foreground disabled:bg-background",
  ghost:
    "bg-transparent text-foreground hover:bg-foreground/10 disabled:text-muted-foreground",
}

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-11 px-5 text-sm font-medium",
  sm: "h-9 px-4 text-xs font-medium",
  lg: "h-12 px-6 text-base font-medium",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = "Button"
