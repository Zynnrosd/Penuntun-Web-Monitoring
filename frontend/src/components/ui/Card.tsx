// frontend/src/components/ui/Card.tsx

import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border-2 border-border bg-surface p-6", className)} {...props} />;
}