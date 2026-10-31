// frontend/src/components/dashboard/StatusPill.tsx

import { cn } from "@/lib/cn";

type Status = "online" | "offline" | "sos-aktif" | "ditangani" | "selesai" | "terkirim" | "gagal" | "live";

const STYLES: Record<Status, string> = {
  online: "bg-success-soft text-success-text",
  offline: "bg-offline text-white",
  "sos-aktif": "bg-danger text-white",
  ditangani: "bg-kritis-soft text-kritis-text",
  selesai: "bg-success-soft text-success-text",
  terkirim: "bg-success-soft text-success-text",
  gagal: "bg-danger text-white",
  live: "bg-live text-white",
};

export function StatusPill({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-pill px-[13px] text-[13px] font-bold", STYLES[status])}
    >
      <span className="h-2 w-2 rounded-pill bg-current" />
      {label}
    </span>
  );
}