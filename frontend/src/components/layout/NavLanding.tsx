// frontend/src/components/layout/NavLanding.tsx

"use client";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string };

// Sebuah bagian dianggap "sedang dibaca" setelah puncaknya melewati garis ini (px dari atas layar).
const GARIS_BACA = 150;

export function NavLanding({ items }: { items: Item[] }) {
  const [aktif, setAktif] = useState(items[0].href);
  const [garis, setGaris] = useState({ kiri: 0, lebar: 0 });
  const [animasi, setAnimasi] = useState(false);
  const tautan = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    function tentukanAktif() {
      let sekarang = items[0].href;
      for (const item of items) {
        const bagian = document.querySelector(item.href);
        if (bagian && bagian.getBoundingClientRect().top <= GARIS_BACA) sekarang = item.href;
      }
      const dasarHalaman = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (dasarHalaman) sekarang = items[items.length - 1].href;
      setAktif(sekarang);
    }

    tentukanAktif();
    window.addEventListener("scroll", tentukanAktif, { passive: true });
    window.addEventListener("resize", tentukanAktif);
    return () => {
      window.removeEventListener("scroll", tentukanAktif);
      window.removeEventListener("resize", tentukanAktif);
    };
  }, [items]);

  useEffect(() => {
    function ukur() {
      const el = tautan.current[aktif];
      if (el) setGaris({ kiri: el.offsetLeft, lebar: el.offsetWidth });
    }

    ukur();
    // Geser halus baru dinyalakan setelah posisi awal terpasang, supaya garis tidak meluncur dari kiri saat halaman dibuka.
    const bingkai = requestAnimationFrame(() => setAnimasi(true));
    window.addEventListener("resize", ukur);
    document.fonts?.ready.then(ukur);
    return () => {
      cancelAnimationFrame(bingkai);
      window.removeEventListener("resize", ukur);
    };
  }, [aktif]);

  function keBagian(e: React.MouseEvent, href: string) {
    const bagian = document.querySelector(href);
    if (!bagian) return;
    e.preventDefault();
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bagian.scrollIntoView({ behavior: kurangiGerak ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", href);
  }

  return (
    <nav className="relative hidden gap-7 text-sm font-semibold md:flex" aria-label="Navigasi halaman">
      {items.map((n) => (
        <a
          key={n.href}
          ref={(el) => {
            tautan.current[n.href] = el;
          }}
          href={n.href}
          onClick={(e) => keBagian(e, n.href)}
          aria-current={aktif === n.href ? "true" : undefined}
          className={`py-2 transition-colors hover:text-primary ${
            aktif === n.href ? "text-primary" : "text-text-secondary"
          }`}
        >
          {n.label}
        </a>
      ))}

      <span
        aria-hidden
        className={`absolute -bottom-0.5 h-[3px] rounded-pill bg-secondary ${
          animasi ? "transition-[left,width] duration-300 ease-out" : ""
        }`}
        style={{ left: garis.kiri, width: garis.lebar, opacity: garis.lebar ? 1 : 0 }}
      />
    </nav>
  );
}