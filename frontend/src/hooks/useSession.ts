// frontend/src/hooks/useSession.ts

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type Peran = "ADMINISTRATOR" | "PENGAWAS";
export type StatusAkun = "MENUNGGU" | "AKTIF" | "DITOLAK" | "NONAKTIF";

export type Sesi = {
  id_admin: string;
  role: Peran;
  status: StatusAkun;
  id_yayasan: string;
  nama_staf: string | null;
  email: string | null;
  no_wa: string | null;
  yayasan: { nama_yayasan: string; kota_yayasan: string } | null;
};

export function useSession() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let aktif = true;

    api
      .get<Sesi>("/auth/saya")
      .then((data) => {
        if (aktif) setSesi(data);
      })
      .catch(() => {
        if (aktif) setSesi(null);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });

    return () => {
      aktif = false;
    };
  }, []);

  return { sesi, memuat };
}

export function inisialNama(nama: string | null | undefined): string {
  if (!nama?.trim()) return "?";
  return nama
    .trim()
    .split(/\s+/)
    .map((bagian) => bagian[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}