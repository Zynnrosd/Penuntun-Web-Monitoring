// frontend/src/components/auth/AuthShell.tsx

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  headline,
  photoSrc,
  children,
}: {
  headline: string;
  photoSrc: string;
  children: React.ReactNode;
}) {
    return (
    <div className="flex h-screen gap-3.5 bg-[#E9EFF8] p-3.5">
      <div className="flex-1 overflow-y-auto rounded-[28px] bg-surface shadow-[0_20px_40px_-28px_rgba(29,58,104,0.4)]">
        <div className="flex min-h-full flex-col p-5">
          <Link
            href="/"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-pill px-3 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-sunken hover:text-primary"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
            Kembali ke beranda
          </Link>
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-[400px] animate-fade-up">
              <Link href="/" className="mb-4 inline-flex" aria-label="Penuntun, kembali ke beranda">
                <Logo variant="biru" tinggi={32} />
              </Link>
              {children}
            </div>
          </div>
        </div>
      </div>

      <aside
        className="relative hidden w-[36%] min-w-[420px] flex-none flex-col justify-end overflow-hidden rounded-[28px] bg-secondary p-9 text-on-dark md:flex"
        aria-label="Tentang Penuntun"
      >
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: `url(${photoSrc})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,42,82,0.96)_0%,rgba(20,42,82,0.7)_22%,rgba(20,42,82,0)_52%)]"
          aria-hidden="true"
        />

        <h2 className="relative max-w-[340px] text-[25px] font-extrabold leading-8 tracking-[-0.03em] text-white">
          {headline}
        </h2>
      </aside>
    </div>
  );
}