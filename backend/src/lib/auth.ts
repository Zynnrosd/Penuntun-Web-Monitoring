// backend/src/lib/auth.ts

import { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseSebagai } from "./supabase";

export type Peran = "ADMINISTRATOR" | "PENGAWAS";
export type StatusAkun = "MENUNGGU" | "AKTIF" | "DITOLAK" | "NONAKTIF";

export type Sesi = {
  id: string;
  role: Peran;
  status: StatusAkun;
  id_yayasan: string;
  db: SupabaseClient;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Belum login" });

  const klien = supabaseSebagai(token);

  const { data: auth, error: authError } = await klien.auth.getUser();
  if (authError || !auth.user) {
    return res.status(401).json({ message: "Sesi tidak valid, silakan login ulang" });
  }

  const { data: akun, error } = await klien
    .from("administrators")
    .select("id_admin, role, status, id_yayasan")
    .eq("id_admin", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("[AUTH] Gagal memuat profil akun:", error);
    return res.status(500).json({ message: "Gagal memuat profil akun" });
  }
  if (!akun) return res.status(403).json({ message: "Profil akun tidak ditemukan" });

  (req as Request & { sesi?: Sesi }).sesi = {
    id: akun.id_admin,
    role: akun.role,
    status: akun.status,
    id_yayasan: akun.id_yayasan,
    db: klien,
  };

  next();
}

export function requireAktif(req: Request, res: Response, next: NextFunction) {
  const { status } = getSession(req);
  if (status !== "AKTIF") {
    return res.status(403).json({ code: "STATUS_TIDAK_AKTIF", status, message: "Akun belum aktif" });
  }
  next();
}

export function requireRole(role: Peran) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (getSession(req).role !== role) {
      return res.status(403).json({ message: "Tidak punya akses" });
    }
    next();
  };
}

export function getSession(req: Request): Sesi {
  const sesi = (req as Request & { sesi?: Sesi }).sesi;
  if (!sesi) throw new Error("getSession dipanggil tanpa requireAuth");
  return sesi;
}

export function db(req: Request): SupabaseClient {
  return getSession(req).db;
}