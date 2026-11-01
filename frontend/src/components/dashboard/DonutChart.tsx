// frontend/src/components/dashboard/DonutChart.tsx

type Segmen = { label: string; value: number; color: string; garis?: string };

const RADIUS = 38;
const LINGKAR = 2 * Math.PI * RADIUS;

export function DonutChart({
  judul,
  segmen,
  bentukPenanda = "kotak",
}: {
  judul: string;
  segmen: Segmen[];
  bentukPenanda?: "kotak" | "bulat";
}) {
  const total = segmen.reduce((jumlah, s) => jumlah + s.value, 0);

  let terpakai = 0;
  const busur = segmen.map((s) => {
    const panjang = total === 0 ? 0 : (s.value / total) * LINGKAR;
    const mulai = terpakai;
    terpakai += panjang;
    return { ...s, panjang, mulai };
  });

  return (
    <section className="flex h-[168px] items-center gap-6 rounded-card border-2 border-border bg-surface px-5">
      <svg
        width="108"
        height="108"
        viewBox="0 0 100 100"
        className="flex-none -rotate-90"
        role="img"
        aria-label={`${judul}: ${segmen.map((s) => `${s.value} ${s.label}`).join(", ")}`}
      >
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="14" />
        {busur.map((s) => (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.panjang} ${LINGKAR}`}
            strokeDashoffset={-s.mulai}
          />
        ))}
      </svg>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 className="mb-1 text-[19px] font-extrabold leading-6">{judul}</h2>
        {segmen.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={`h-3 w-3 flex-none ${bentukPenanda === "bulat" ? "rounded-pill" : "rounded-[3px]"}`}
              style={{ backgroundColor: s.color, boxShadow: s.garis ? `inset 0 0 0 1px ${s.garis}` : undefined }}
            />
            <span className="truncate">{s.label}</span>
            <b className="angka ml-auto">{s.value}</b>
          </div>
        ))}
      </div>
    </section>
  );
}