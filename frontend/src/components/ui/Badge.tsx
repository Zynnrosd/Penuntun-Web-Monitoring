// frontend/src/components/ui/Badge.tsx

import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "kritis" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-text-secondary",
  primary: "bg-info-soft text-info-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  kritis: "bg-kritis-soft text-kritis-text",
  danger: "bg-danger text-white",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-pill px-[13px] text-[13px] font-bold",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}