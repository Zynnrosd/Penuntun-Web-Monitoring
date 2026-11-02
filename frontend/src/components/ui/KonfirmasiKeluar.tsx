// frontend/src/components/ui/KonfirmasiKeluar.tsx

"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function KonfirmasiKeluar({
  onBatal,
  onKeluar,
}: {
  onBatal: () => void;
  onKeluar: () => Promise<void>;
}) {
  const [keluar, setKeluar] = useState(false);

  async function konfirmasi() {
    setKeluar(true);
    try {
      await onKeluar();
    } finally {
      setKeluar(false);
    }
  }

  return (
    <Modal judul="Keluar dari akun?" keterangan="Anda perlu masuk lagi untuk memantau perangkat." onTutup={onBatal}>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onBatal} disabled={keluar}>
          Batal
        </Button>
        <Button onClick={konfirmasi} disabled={keluar}>
          {keluar ? "Keluar…" : "Keluar"}
        </Button>
      </div>
    </Modal>
  );
}