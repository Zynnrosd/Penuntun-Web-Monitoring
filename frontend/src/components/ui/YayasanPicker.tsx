// frontend/src/components/ui/YayasanPicker.tsx

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Field } from "@/components/ui/Field";

export type Yayasan = { id_yayasan: string; nama_yayasan: string; kota_yayasan: string };

export function YayasanPicker({
  nilaiAwal = "",
  dipilih,
  onPilih,
}: {
  nilaiAwal?: string;
  dipilih: Yayasan | null;
  onPilih: (y: Yayasan | null) => void;
}) {
  const [query, setQuery] = useState(nilaiAwal);
  const [hasil, setHasil] = useState<Yayasan[]>([]);
  const [mencari, setMencari] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setHasil([]);
      return;
    }

    setMencari(true);
    const timer = setTimeout(() => {
      api
        .get<Yayasan[]>(`/auth/yayasan?q=${encodeURIComponent(q)}`)
        .then(setHasil)
        .catch(() => setHasil([]))
        .finally(() => setMencari(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const q = query.trim();

  return (
    <div className="flex flex-col gap-2.5">
      <Field
        label="Cari yayasan (minimal 3 huruf)"
        placeholder="Nama yayasan"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onPilih(null);
        }}
        autoComplete="off"
      />

      {q.length >= 3 && (
        <div
          className="overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1.5px_var(--color-border)]"
          role="listbox"
          aria-label="Hasil pencarian yayasan"
        >
          {mencari && hasil.length === 0 && (
            <p className="px-4 py-3 text-[15px] text-text-secondary">Mencari…</p>
          )}

          {!mencari && hasil.length === 0 && (
            <p className="px-4 py-3 text-[15px] text-text-secondary">
              Yayasan tidak ditemukan. Periksa ejaannya, atau minta Administrator yayasan mendaftarkan yayasannya
              lebih dulu.
            </p>
          )}

          {hasil.map((y, i) => {
            const aktif = dipilih?.id_yayasan === y.id_yayasan;
            return (
              <button
                key={y.id_yayasan}
                type="button"
                role="option"
                aria-selected={aktif}
                onClick={() => onPilih(y)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                  i > 0 ? "border-t border-secondary-soft" : ""
                } ${aktif ? "bg-surface-sunken shadow-[inset_3px_0_0_var(--color-secondary)]" : "hover:bg-surface-sunken"}`}
              >
                <span>
                  <span className="block font-bold leading-[22px]">{y.nama_yayasan}</span>
                  <span className="text-sm text-text-secondary">{y.kota_yayasan}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}