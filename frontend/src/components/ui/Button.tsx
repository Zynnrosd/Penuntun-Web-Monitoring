import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-border-strong text-text-primary hover:bg-surface-sunken",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-text-secondary hover:bg-surface-sunken",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-input px-4 py-2 text-sm font-medium min-h-[40px] transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}