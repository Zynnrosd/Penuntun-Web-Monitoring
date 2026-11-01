// frontend/src/components/layout/PageHeader.tsx

"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useSession, inisialNama } from "@/hooks/useSession";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { sesi } = useSession();

  return (
    <header className="mb-6 flex min-h-[72px] items-center justify-between gap-6 border-b border-secondary/[0.18]">
      <div className="min-w-0">
        <h1 className="text-[26px] font-extrabold leading-8 tracking-[-0.035em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm leading-5 text-text-secondary">{subtitle}</p>}
      </div>

      {sesi && (
        <Link
          href="/profil"
          className="flex flex-none items-center gap-3 rounded-pill py-1 pl-3 pr-1 transition-colors hover:bg-white/60"
        >
          <div className="hidden text-right sm:block">
            <div className="text-sm font-bold leading-5">
              {sesi.role === "ADMINISTRATOR" ? "Administrator" : "Pengawas"}
            </div>
            <div className="text-sm leading-5 text-text-secondary">{sesi.nama_staf ?? "—"}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent text-[13px] font-bold text-primary">
            {inisialNama(sesi.nama_staf)}
          </div>
          <ChevronDown size={18} strokeWidth={2.2} className="text-text-secondary" />
        </Link>
      )}
    </header>
  );
}