// frontend/src/components/ui/YayasanPicker.tsx

"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { Field } from "@/components/ui/Field";

export type Yayasan = { id_yayasan: string; nama_yayasan: string; kota_yayasan: string };

export function YayasanPicker({
  dipilih,
  onPilih,
}: {
  dipilih: Yayasan | null;
  onPilih: (y: Yayasan | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [hasil, setHasil] = useState<Yayasan[]>([]);
  const [terbuka, setTerbuka] = useState(false);
  const [mencari, setMencari] = useState(false);
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terbuka || query.trim().length < 3) {
      setHasil([]);
      return;
    }

    setMencari(true);
    // Pencarian ditunda 300 ms setelah berhenti mengetik, supaya tidak memanggil server setiap huruf.
    const timer = setTimeout(() => {
      api
        .get<Yayasan[]>(`/auth/yayasan?q=${encodeURIComponent(query.trim())}`)
        .then(setHasil)
        .catch(() => setHasil([]))
        .finally(() => setMencari(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, terbuka]);

  useEffect(() => {
    function klikLuar(e: MouseEvent) {
      if (kotak.current && !kotak.current.contains(e.target as Node)) setTerbuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, []);

  function pilih(y: Yayasan) {
    onPilih(y);
    setQuery(`${y.nama_yayasan}, ${y.kota_yayasan}`);
    setTerbuka(false);
  }

  const tampilDaftar = terbuka && query.trim().length >= 3;

  return (
    <div ref={kotak} className="relative">
      <Field
        label="Cari yayasan (minimal 3 huruf)"
        placeholder="Nama yayasan"
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={tampilDaftar}
        onChange={(e) => {
          setQuery(e.target.value);
          onPilih(null);
          setTerbuka(true);
        }}
        onFocus={() => setTerbuka(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setTerbuka(false);
        }}
      />

      {tampilDaftar && (
        <div
          role="listbox"
          aria-label="Hasil pencarian yayasan"
          className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[220px] overflow-y-auto rounded-[20px] bg-surface p-2 shadow-[0_0_0_1px_var(--color-border),0_18px_36px_-14px_rgba(29,58,104,0.45)]"
        >
          {mencari && hasil.length === 0 && (
            <p className="px-3 py-2 text-sm text-text-secondary">Mencari…</p>
          )}

          {!mencari && hasil.length === 0 && (
            <p className="px-3 py-2 text-sm leading-5 text-text-secondary">
              Yayasan tidak ditemukan. Periksa ejaannya, atau minta Administrator yayasan mendaftarkan yayasannya
              lebih dulu.
            </p>
          )}

          {hasil.map((y) => (
            <button
              key={y.id_yayasan}
              type="button"
              role="option"
              aria-selected={dipilih?.id_yayasan === y.id_yayasan}
              onClick={() => pilih(y)}
              className="block w-full rounded-[14px] px-3.5 py-2.5 text-left hover:bg-surface-sunken"
            >
              <span className="block font-bold leading-[22px]">{y.nama_yayasan}</span>
              <span className="text-sm text-text-secondary">{y.kota_yayasan}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}