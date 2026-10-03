type Tone = "primary" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function StatCard({
  label,
  value,
  tone = "primary",
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
    <div className={`rounded-card ${TONES[tone]} p-5 text-white shadow-card`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-90">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold leading-none">{value}</span>
        {suffix && <span className="mb-0.5 text-xs opacity-80">{suffix}</span>}
      </div>
    </div>
  );
}