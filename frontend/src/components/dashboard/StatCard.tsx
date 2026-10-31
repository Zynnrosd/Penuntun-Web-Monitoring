// frontend/src/components/dashboard/StatCard.tsx

type Tone = "primary" | "success" | "warning" | "danger" | "soft";

const TONES: Record<Tone, string> = {
  primary: "bg-info text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-heading",
  danger: "bg-danger text-white",
  soft: "bg-secondary-soft text-heading",
};

export function StatCard({
  label,
  value,
  tone = "soft",
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
    <div className={`flex h-32 flex-col justify-center gap-1.5 rounded-card px-[26px] ${TONES[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="angka text-[52px] font-extrabold leading-none">{value}</span>
        {suffix && <span className="text-sm font-semibold opacity-80">{suffix}</span>}
      </div>
    </div>
  );
}