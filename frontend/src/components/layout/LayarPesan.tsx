// frontend/src/components/layout/LayarPesan.tsx

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const TOMBOL_UTAMA =
  "inline-flex min-h-11 items-center justify-center rounded-pill bg-secondary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover";
export const TOMBOL_SEKUNDER =
  "inline-flex min-h-11 items-center justify-center rounded-pill bg-surface px-6 text-sm font-bold text-secondary shadow-[inset_0_0_0_2px_var(--color-border)] transition-colors hover:bg-surface-sunken";

export function LayarPesan({
  ikon: Ikon,
  kode,
  judul,
  isi,
  petunjuk,
  children,
}: {
  ikon: LucideIcon;
  kode: string;
  judul: string;
  isi: string;
  petunjuk?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex h-[88px] flex-none items-center border-b border-secondary/[0.18] px-6 sm:px-11">
        <Link href="/" aria-label="Penuntun, kembali ke beranda">
          <Logo variant="biru" tinggi={32} />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[560px] animate-fade-up text-center">
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-pill bg-accent shadow-[0_0_0_14px_rgba(255,255,255,0.6),0_0_0_30px_rgba(255,255,255,0.3)]">
            <Ikon size={32} strokeWidth={2} className="text-secondary" aria-hidden="true" />
          </div>

          <p className="data mt-14 inline-block rounded-pill bg-surface px-[18px] py-1.5 text-[13px] tracking-[0.1em] text-text-secondary">
            {kode}
          </p>
          <h1 className="mt-4 text-[32px] font-extrabold leading-10 tracking-[-0.04em] text-heading">{judul}</h1>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-6 text-text-secondary">{isi}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>

          {petunjuk && <p className="mt-5 text-[13px] leading-5 text-text-secondary">{petunjuk}</p>}
        </div>
      </div>
    </main>
  );
}