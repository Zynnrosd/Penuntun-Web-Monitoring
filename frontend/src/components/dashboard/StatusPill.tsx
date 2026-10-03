import { cn } from "@/lib/cn";

type Status = "online" | "offline" | "sos-aktif" | "selesai" | "terkirim" | "gagal";

const STYLES: Record<Status, string> = {
  online: "bg-success-soft text-success",
  offline: "bg-neutral-status/10 text-neutral-status",
  "sos-aktif": "bg-danger-soft text-danger",
  selesai: "bg-success-soft text-success",
  terkirim: "bg-success-soft text-success",
  gagal: "bg-danger-soft text-danger",
};

export function StatusPill({ status, label }: { status: Status; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}