// frontend/src/hooks/useRealtimeTable.ts

"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

// Saluran yang sedang putus. Satu saluran per pemanggilan hook, jadi disimpan per kunci.
const terputus = new Set<string>();
const pendengar = new Set<() => void>();

function setTerputus(kunci: string, putus: boolean) {
  const berubah = putus ? !terputus.has(kunci) : terputus.delete(kunci);
  if (putus) terputus.add(kunci);
  if (berubah) pendengar.forEach((fn) => fn());
}

function langganan(fn: () => void) {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

// true bila ada saluran realtime yang putus. Dipakai banner dan penanda "Live".
export function useRealtimePutus() {
  return useSyncExternalStore(
    langganan,
    () => terputus.size > 0,
    () => false
  );
}

export function useRealtimeTable(table: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const kunci = `${table}-${Math.random().toString(36).slice(2, 8)}`;
    let aktif = true;
    let pernahPutus = false;

    const channel = supabase
      .channel(`realtime-${kunci}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        onChangeRef.current();
      })
      .subscribe((status) => {
        if (!aktif) return;

        if (status === "SUBSCRIBED") {
          setTerputus(kunci, false);
          // Perubahan selama putus tidak terkirim ulang, jadi data dimuat ulang saat tersambung kembali.
          if (pernahPutus) onChangeRef.current();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          pernahPutus = true;
          setTerputus(kunci, true);
        }
      });

    return () => {
      aktif = false;
      setTerputus(kunci, false);
      supabase.removeChannel(channel);
    };
  }, [table]);
}