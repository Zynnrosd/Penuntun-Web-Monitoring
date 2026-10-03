import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card bg-surface p-5 shadow-card", className)} {...props} />;
}