// frontend/src/app/not-found.tsx

import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { LayarPesan, TOMBOL_UTAMA, TOMBOL_SEKUNDER } from "@/components/layout/LayarPesan";

export default function TidakDitemukan() {
  return (
    <LayarPesan
      ikon={MapPinOff}
      kode="ERROR 404"
      judul="Halaman tidak ditemukan"
      isi="Alamat yang Anda buka tidak ada atau sudah dipindahkan. Periksa kembali alamatnya, atau kembali ke Beranda."
    >
      <Link href="/home" className={TOMBOL_UTAMA}>
        Kembali ke Beranda
      </Link>
      <Link href="/monitoring" className={TOMBOL_SEKUNDER}>
        Pantau lokasi
      </Link>
    </LayarPesan>
  );
}