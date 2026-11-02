// frontend/src/app/sesi-berakhir/page.tsx

import Link from "next/link";
import { Clock } from "lucide-react";
import { LayarPesan, TOMBOL_UTAMA } from "@/components/layout/LayarPesan";

export default function SesiBerakhirPage() {
  return (
    <LayarPesan
      ikon={Clock}
      kode="SESI BERAKHIR"
      judul="Sesi Anda telah berakhir"
      isi="Demi keamanan, Anda otomatis keluar setelah beberapa waktu tidak aktif atau saat akun dinonaktifkan. Masuk lagi untuk melanjutkan."
      petunjuk="Jika Anda merasa akun Anda dinonaktifkan, hubungi Administrator yayasan."
    >
      <Link href="/login" className={TOMBOL_UTAMA}>
        Masuk lagi
      </Link>
    </LayarPesan>
  );
}