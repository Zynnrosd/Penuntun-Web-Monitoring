// backend/src/lib/waktu.ts

const SELISIH_WIB_MS = 7 * 60 * 60 * 1000;

// Pukul 00.00 WIB hari ini (ISO/UTC), batas reset harian riwayat perjalanan.
export function awalHariIniWIB(): string {
  const sekarangWIB = new Date(Date.now() + SELISIH_WIB_MS);
  sekarangWIB.setUTCHours(0, 0, 0, 0);
  return new Date(sekarangWIB.getTime() - SELISIH_WIB_MS).toISOString();
}