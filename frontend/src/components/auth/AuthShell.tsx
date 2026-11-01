// frontend/src/components/auth/AuthShell.tsx

import Link from "next/link";
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
        <div className="flex min-h-full items-center justify-center p-5">
          <div className="w-full max-w-[400px] animate-fade-up">
            <Link href="/" className="mb-4 inline-flex" aria-label="Penuntun, kembali ke beranda">
              <Logo variant="biru" tinggi={32} />
            </Link>
            {children}
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

        <svg
          className="absolute -right-24 top-16 h-80 w-80"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          {[0, 1.3, 2.6].map((delay) => (
            <circle
              key={delay}
              cx="100"
              cy="100"
              r="96"
              stroke="#5FD0D9"
              strokeWidth="1.5"
              className="animate-sweep"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </svg>

        <h2 className="relative max-w-[340px] text-[25px] font-extrabold leading-8 tracking-[-0.03em] text-white">
          {headline}
        </h2>
      </aside>
    </div>
  );
}