"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeTable(table: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        onChangeRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}