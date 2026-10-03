import { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";

type SessionPayload = { id: string; role: "administrator" | "pengawas"; id_yayasan: string };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Belum login" });

  console.time("getUser");
  console.timeEnd("getUser");

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
if (authError || !authData.user) {
  console.error("DEBUG authError:", authError);
  return res.status(401).json({ message: "Sesi tidak valid, silakan login ulang" });
}

  console.time("queryAdmin");
  const { data: admin, error: adminError } = await supabase
    .from("administrators")
    .select("id_admin, role, id_yayasan")
    .eq("id_admin", authData.user.id)
    .single();
  console.timeEnd("queryAdmin");

  if (adminError || !admin) {
    return res.status(403).json({ message: "Profil administrator tidak ditemukan" });
  }

  (req as any).user = { id: admin.id_admin, role: admin.role, id_yayasan: admin.id_yayasan };
  next();
}

export function requireRole(role: "administrator") {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as SessionPayload;
    if (user.role !== role) return res.status(403).json({ message: "Tidak punya akses" });
    next();
  };
}

export function getSession(req: Request): SessionPayload {
  return (req as any).user;
}