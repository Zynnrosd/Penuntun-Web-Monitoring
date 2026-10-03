import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

function wajib(nama: string): string {
  const nilai = process.env[nama];
  if (!nilai) throw new Error(`Environment variable ${nama} belum diset di .env`);
  return nilai;
}

export const env = {
  PORT: process.env.PORT || "4000",
  SUPABASE_URL: wajib("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: wajib("SUPABASE_SERVICE_ROLE_KEY"),
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || "",
  WHATSAPP_GATEWAY_API_KEY: process.env.WHATSAPP_GATEWAY_API_KEY || "",
};