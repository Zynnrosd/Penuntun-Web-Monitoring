import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/yayasan", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim() ?? "";
  if (q.length < 2) return res.json([]);

  const aman = q.replace(/[%_]/g, (c) => `\\${c}`);

  const { data, error } = await supabase
    .from("yayasan")
    .select("id_yayasan, nama_yayasan")
    .ilike("nama_yayasan", `%${aman}%`)
    .limit(8);

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post("/register", async (req, res) => {
  const { email, password, nama_staf, nama_yayasan, id_yayasan: idYayasanDipilih, no_wa, tipe_akun } = req.body;

  const isPerseorangan = tipe_akun === "perseorangan";

  if (!isPerseorangan && !nama_yayasan?.trim() && !idYayasanDipilih) {
    return res.status(400).json({ message: "Pilih atau isi nama yayasan" });
  }
  if (!nama_staf?.trim()) {
    return res.status(400).json({ message: "Nama lengkap wajib diisi" });
  }

  const noWaBersih: string | null = no_wa?.trim() || null;
  if (noWaBersih && !/^\+62[0-9]{9,13}$/.test(noWaBersih)) {
    return res.status(400).json({ message: "Format nomor WhatsApp tidak valid. Gunakan format +62xxxxxxxxx" });
  }

  let idYayasan: string;
  let jadiAdministrator: boolean;

  if (isPerseorangan) {
    const { data: newYayasan, error: yayasanError } = await supabase
      .from("yayasan")
      .insert({ nama_yayasan: `${nama_staf.trim()} (Perseorangan)` })
      .select()
      .single();
    if (yayasanError || !newYayasan) {
      return res.status(400).json({ message: yayasanError?.message ?? "Gagal membuat akun perseorangan" });
    }
    idYayasan = newYayasan.id_yayasan;
    jadiAdministrator = true;
  } else if (idYayasanDipilih) {
    const { data: yayasanAda } = await supabase
      .from("yayasan")
      .select("id_yayasan")
      .eq("id_yayasan", idYayasanDipilih)
      .single();
    if (!yayasanAda) return res.status(400).json({ message: "Yayasan tidak ditemukan" });
    idYayasan = yayasanAda.id_yayasan;
    jadiAdministrator = false;
  } else {
    const { data: newYayasan, error: yayasanError } = await supabase
      .from("yayasan")
      .insert({ nama_yayasan: nama_yayasan.trim() })
      .select()
      .single();
    if (yayasanError || !newYayasan) {
      return res.status(400).json({ message: yayasanError?.message ?? "Gagal membuat yayasan" });
    }
    idYayasan = newYayasan.id_yayasan;
    jadiAdministrator = true;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (createError || !created.user) {
    return res.status(400).json({ message: createError?.message ?? "Registrasi gagal" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("administrators")
    .insert({
      id_admin: created.user.id, email, nama_staf, id_yayasan: idYayasan, no_wa: noWaBersih,
      role: jadiAdministrator ? "administrator" : "pengawas",
    })
    .select()
    .single();

  if (profileError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ message: profileError.message });
  }

  res.status(201).json({
    message: isPerseorangan
      ? "Akun perseorangan berhasil dibuat"
      : jadiAdministrator
      ? "Akun berhasil dibuat sebagai Administrator yayasan baru"
      : "Akun berhasil dibuat sebagai Pengawas",
    id_admin: profile.id_admin,
    role: profile.role,
  });
});

export default router;