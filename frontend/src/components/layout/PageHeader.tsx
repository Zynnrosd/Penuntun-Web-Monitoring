"use client";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const session = useSession();
  const inisial =
    session?.nama_staf
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="mb-6">
      <div className="flex h-20 items-center justify-between border-b border-border">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-tight text-text-secondary">{subtitle}</p>}
        </div>
        {session && (
          <Link href="/profil" className="flex items-center gap-3 rounded-input px-2 py-1.5 transition-colors hover:bg-surface-sunken">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {inisial}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-primary">
                {session.role === "administrator" ? "Administrator" : "Pengawas"}
              </div>
              <div className="text-xs text-text-secondary">{session.nama_staf}</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}