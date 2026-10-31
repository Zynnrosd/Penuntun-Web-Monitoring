// frontend/src/components/ui/Field.tsx

"use client";
import { InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  trailing,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(
            "h-[50px] w-full rounded-field bg-field px-[18px] text-[15px] outline-none",
            "focus:bg-surface focus:shadow-[inset_0_0_0_2px_var(--color-ring)]",
            trailing && "pr-28",
            className
          )}
          {...props}
        />
        {trailing && <div className="absolute right-[18px] top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hint && <p className="mt-1.5 text-sm text-text-secondary">{hint}</p>}
    </div>
  );
}

export function TombolTampilkan({ aktif, onToggle }: { aktif: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-sm font-bold text-secondary">
      {aktif ? "Sembunyikan" : "Tampilkan"}
    </button>
  );
}