// frontend/src/components/dashboard/StatCard.tsx

type Tone = "primary" | "success" | "warning" | "danger" | "biru" | "kuning" | "soft";

const TONES: Record<Tone, string> = {
  primary: "bg-info text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-heading",
  danger: "bg-danger text-white",
  biru: "bg-tile-blue text-heading",
  kuning: "bg-tile-amber text-heading",
  soft: "bg-surface text-text-secondary shadow-[inset_0_0_0_2px_var(--color-border)]",
};

export function StatCard({
  label,
  value,
  tone = "biru",
  icon,
  suffix,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
  icon?: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className={`flex h-28 flex-col justify-center gap-1.5 rounded-card px-[26px] ${TONES[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="angka text-[38px] font-extrabold leading-none">{value}</span>
        {suffix && <span className="text-sm font-semibold opacity-80">{suffix}</span>}
      </div>
    </div>
  );
}