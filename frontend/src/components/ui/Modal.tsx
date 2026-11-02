// frontend/src/components/ui/Modal.tsx

"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  judul,
  keterangan,
  onTutup,
  children,
}: {
  judul: string;
  keterangan?: string;
  onTutup: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function tombol(e: KeyboardEvent) {
      if (e.key === "Escape") onTutup();
    }
    document.addEventListener("keydown", tombol);
    return () => document.removeEventListener("keydown", tombol);
  }, [onTutup]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-heading/40 p-4"
      onClick={onTutup}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-modal bg-surface p-6 shadow-modal"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-extrabold leading-6">{judul}</h2>
            {keterangan && <p className="mt-1 text-sm leading-5 text-text-secondary">{keterangan}</p>}
          </div>
          <button
            onClick={onTutup}
            aria-label="Tutup"
            className="-mr-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-pill text-text-secondary hover:bg-surface-sunken"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}