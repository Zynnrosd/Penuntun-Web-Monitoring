"use client";
import { useEffect, useRef, useState } from "react";
import { Building2, Plus, ChevronDown } from "lucide-react";
import { api } from "@/lib/api-client";

type Opsi = { id_yayasan: string; nama_yayasan: string };

export function YayasanCombobox({
  value,
  onSelectExisting,
  onSelectNew,
}: {
  value: string;
  onSelectExisting: (id: string, nama: string) => void;
  onSelectNew: (nama: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [hasil, setHasil] = useState<Opsi[]>([]);
  const [terbuka, setTerbuka] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHasil([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get<Opsi[]>(`/auth/yayasan?q=${encodeURIComponent(query.trim())}`).then(setHasil).catch(() => setHasil([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setTerbuka(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adaYangCocokPersis = hasil.some((h) => h.nama_yayasan.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={boxRef} className="relative">
      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelectNew(e.target.value);
          setTerbuka(true);
        }}
        onFocus={() => setTerbuka(true)}
        placeholder="Cari nama yayasan..."
        className="w-full rounded-input border border-border py-2 pl-9 pr-8 text-sm outline-none focus:border-primary"
      />
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />

      {terbuka && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-input border border-border bg-surface shadow-modal">
          {hasil.map((h) => (
            <button
              key={h.id_yayasan}
              type="button"
              onClick={() => {
                onSelectExisting(h.id_yayasan, h.nama_yayasan);
                setQuery(h.nama_yayasan);
                setTerbuka(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-sunken"
            >
              <Building2 size={14} className="text-text-secondary" />
              {h.nama_yayasan}
            </button>
          ))}
          {!adaYangCocokPersis && (
            <button
              type="button"
              onClick={() => {
                onSelectNew(query.trim());
                setTerbuka(false);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm text-primary hover:bg-primary-soft"
            >
              <Plus size={14} />
              Buat yayasan baru: &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}