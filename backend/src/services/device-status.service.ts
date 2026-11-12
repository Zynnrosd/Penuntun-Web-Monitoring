// backend/src/services/device-status.service.ts

import { supabase } from "../lib/supabase";

// Perangkat dianggap offline bila tidak ada heartbeat atau data selama 20 detik.
const OFFLINE_TIMEOUT_MS = 20_000;
const CHECK_INTERVAL_MS = 10_000;

let interval: NodeJS.Timeout | null = null;

async function cekPerangkatOffline() {
  try {
    const batasWaktu = new Date(Date.now() - OFFLINE_TIMEOUT_MS).toISOString();

    const { data, error } = await supabase
      .from("perangkat")
      .update({ status_online: false })
      .eq("status_online", true)
      .lt("last_active", batasWaktu)
      .select("id_perangkat");

    if (error) {
      console.error("[DEVICE MONITOR] Gagal mengecek perangkat:", error.message);
      return;
    }

    if (data && data.length > 0) {
      for (const perangkat of data) {
        console.log(`[DEVICE MONITOR] ${perangkat.id_perangkat} → OFFLINE`);
      }
    }
  } catch (error) {
    console.error("[DEVICE MONITOR] Error:", error instanceof Error ? error.message : error);
  }
}

export function startDeviceStatusMonitor() {
  if (interval) return;

  console.log("[DEVICE MONITOR] Aktif — timeout offline: 20 detik");

  cekPerangkatOffline();
  interval = setInterval(() => {
    cekPerangkatOffline();
  }, CHECK_INTERVAL_MS);
}
