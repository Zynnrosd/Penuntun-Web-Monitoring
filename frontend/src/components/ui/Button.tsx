// frontend/src/components/ui/Button.tsx

import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-secondary text-white hover:bg-primary-hover",
  secondary: "bg-surface text-secondary shadow-[inset_0_0_0_2px_var(--color-border)] hover:bg-surface-sunken",
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
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-input px-6 text-sm font-bold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}