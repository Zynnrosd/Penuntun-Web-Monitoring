// frontend/src/lib/format.ts

export function waktuRelatif(iso: string | null): string {
  if (!iso) return "Belum pernah";

  const selisih = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(selisih)) return "Belum pernah";

  const menit = Math.floor(selisih / 60000);
  if (menit < 1) return "Baru saja";
  if (menit < 60) return `${menit} menit lalu`;

  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;

  const hari = Math.floor(jam / 24);
  if (hari === 1) return "Kemarin";
  if (hari < 7) return `${hari} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function jamWIB(iso: string): string {
  return `${new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")} WIB`;
}

export function koordinat(lat: number | null, long: number | null): string | null {
  if (lat == null || long == null) return null;
  return `${lat.toFixed(6)}, ${long.toFixed(6)}`;
}

export type TingkatBaterai = "baik" | "sedang" | "kritis" | "kosong";

export function tingkatBaterai(persen: number | null): TingkatBaterai {
  if (persen == null) return "kosong";
  if (persen < 20) return "kritis";
  if (persen < 60) return "sedang";
  return "baik";
}