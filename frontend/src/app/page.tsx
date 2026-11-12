// frontend/src/app/page.tsx

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, MapPin, Users, Wifi, Bell } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Muncul } from "@/components/ui/Muncul";
import { NavLanding } from "@/components/layout/NavLanding";

const NAV = [
  { href: "#beranda", label: "Beranda" },
  { href: "#fitur", label: "Fitur" },
  { href: "#tentang", label: "Tentang" },
  { href: "#cara-kerja", label: "Cara Kerja" },
];

const KEUNGGULAN = [
  {
    ikon: <MapPin size={20} strokeWidth={2} className="text-primary" />,
    warna: "bg-tile-blue",
    judul: "Lokasi real-time",
    isi: "Posisi terbaru di peta, plus waktu terakhir terlihat saat offline.",
  },
  {
    ikon: <AlertTriangle size={20} strokeWidth={2} className="text-danger" />,
    warna: "bg-tile-amber",
    judul: "SOS langsung sampai",
    isi: "Masuk ke dashboard dan WhatsApp sekaligus.",
  },
  {
    ikon: <Users size={20} strokeWidth={2} className="text-primary" />,
    warna: "bg-[#CDEFE0]",
    judul: "Privasi terjaga",
    isi: "Anda hanya melihat pengguna yang terdaftar di yayasan Anda.",
  },
];

const LANGKAH = [
  {
    ikon: <Wifi size={44} strokeWidth={1.9} />,
    judul: "Tongkat terhubung",
    isi: "Tongkat mengirim lokasi dan status baterai lewat internet, terus-menerus.",
  },
  {
    ikon: <MapPin size={44} strokeWidth={1.9} />,
    judul: "Tampil di dashboard",
    isi: "Posisi dan baterai pengguna langsung tampil di peta.",
  },
  {
    ikon: <Bell size={44} strokeWidth={1.9} />,
    judul: "Peringatan SOS",
    isi: "Tombol SOS ditekan, Pengawas langsung diberi tahu lewat dashboard dan WhatsApp.",
  },
];

function TombolUtama({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-pill bg-secondary px-7 py-[15px] text-[15px] font-bold text-white shadow-[0_14px_24px_-12px_rgba(27,58,92,0.75)] transition-colors hover:bg-primary-hover"
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

function PanahLangkah({ naik }: { naik: boolean }) {
  return (
    <div aria-hidden className="hidden items-center justify-center pt-12 lg:flex">
      <svg width="88" height="60" viewBox="0 0 88 60" fill="none">
        <path
          d={naik ? "M4 44C26 44 30 12 64 12" : "M4 16C26 16 30 48 64 48"}
          stroke="#12233D"
          strokeOpacity="0.4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        <path
          d={naik ? "M58 6l9 6-9 6" : "M58 42l9 6-9 6"}
          stroke="#12233D"
          strokeOpacity="0.4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function KartuContoh() {
  const baris = [
    {
      ikon: <MapPin size={16} strokeWidth={2} className="text-primary" />,
      latar: "bg-primary-soft",
      judul: "Pak Budi, PNT-01",
      isi: "Jl. Pahlawan · Live",
      label: "Online",
      rona: "bg-success-soft text-success-text",
      sorot: false,
    },
    {
      ikon: <AlertTriangle size={16} strokeWidth={2} className="text-danger" />,
      latar: "bg-danger-soft",
      judul: "Tombol SOS ditekan",
      isi: "Pak Budi, 2 menit lalu",
      label: "SOS",
      rona: "bg-danger text-white",
      sorot: true,
    },
    {
      ikon: <MapPin size={16} strokeWidth={2} className="text-offline" />,
      latar: "bg-surface-sunken",
      judul: "Bu Sari, PNT-04",
      isi: "Terakhir terlihat 18 menit lalu",
      label: "Offline",
      rona: "bg-secondary-soft text-[#44587E]",
      sorot: false,
    },
  ];

  return (
    <div className="rounded-[28px] bg-surface p-3.5 shadow-[0_26px_44px_-18px_rgba(29,58,104,0.5)]">
      <div className="flex items-center justify-between px-1 pb-2.5">
        <b className="text-sm font-bold">Pemantauan</b>
        <span className="text-xs text-text-secondary">Contoh tampilan</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {baris.map((b) => (
          <div
            key={b.judul}
            className={`flex items-center gap-3 rounded-inner px-3 py-2.5 ${
              b.sorot ? "bg-danger-soft/60 shadow-[inset_0_0_0_1px_rgba(212,52,63,0.3)]" : "bg-[#F1F5FA]"
            }`}
          >
            <span className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-nav ${b.latar}`}>
              {b.ikon}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-sm font-semibold leading-5">{b.judul}</b>
              <span className="block truncate text-xs leading-4 text-text-secondary">{b.isi}</span>
            </span>
            <span className={`flex-none rounded-pill px-2.5 py-0.5 text-xs font-bold ${b.rona}`}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#F6F8FC]">
      <header className="sticky top-0 z-50 bg-[#F6F8FC]/85 backdrop-blur-[10px]">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-6">
          <Link href="#beranda" aria-label="PENUNTUN, ke awal halaman">
            <Logo variant="biru" tinggi={28} />
          </Link>

          <NavLanding items={NAV} />

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-pill px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:text-primary"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-pill bg-secondary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      </header>

      <section id="beranda" className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-18 pt-16 lg:grid-cols-2">
          <div>
            <h1 className="text-[44px] font-extrabold leading-[0.97] tracking-[-0.055em] sm:text-[58px] lg:text-[72px]">
              Pantau tongkat untuk langkah yang{" "}
              <em
                className="whitespace-nowrap not-italic"
                style={{
                  background:
                    "linear-gradient(transparent 60%, var(--color-accent) 60%, var(--color-accent) 92%, transparent 92%)",
                  padding: "0 4px",
                  margin: "0 -4px",
                }}
              >
                lebih aman
              </em>
            </h1>

            <p className="mt-6 max-w-md text-[18px] font-medium leading-7 text-text-secondary">
              Dashboard bagi pengurus yayasan untuk memantau lokasi, baterai, dan SOS secara langsung.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TombolUtama href="/register">Daftar sekarang</TombolUtama>
              <Link
                href="/login"
                className="inline-flex items-center rounded-pill px-7 py-[15px] text-[15px] font-bold text-primary shadow-[inset_0_0_0_2px_var(--color-primary)] transition-colors hover:bg-primary-soft"
              >
                Masuk
              </Link>
            </div>
          </div>

          <Muncul
            tunda={150}
            className="relative h-[380px] overflow-hidden rounded-[40px] bg-[#D6E4F5] shadow-[0_30px_50px_-28px_rgba(29,58,104,0.55)] lg:h-[540px] lg:rotate-[1.5deg]"
          >
            <Image
              src="/landing-hero.png"
              alt="Pengguna tongkat PENUNTUN berjalan di trotoar"
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
              priority
            />
          </Muncul>
        </div>
      </section>

      <section id="fitur" className="scroll-mt-[8px]">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-22 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative order-2 h-[320px] lg:order-1 lg:-ml-40 lg:h-[440px]">
            <Muncul className="relative h-full overflow-hidden rounded-[32px] bg-[#D6E4F5] lg:rounded-[0_200px_200px_0]">
              <Image
                src="/landing-kota.png"
                alt="Pengguna tongkat PENUNTUN di area perkotaan"
                fill
                sizes="(max-width: 1024px) 100vw, 620px"
                className="object-cover object-[30%_center]"
              />
            </Muncul>

            <Muncul
              tunda={250}
              className="absolute -bottom-10 right-0 w-[300px] max-w-[88%] lg:-right-6 lg:w-[340px]"
            >
              <KartuContoh />
            </Muncul>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[42px] lg:text-[48px]">
              Ingin tahu mereka baik-baik saja?
            </h2>

            <p className="mt-4 max-w-md text-[17px] leading-7 text-text-secondary">
              Dengan dashboard <b className="font-semibold text-primary">PENUNTUN</b>, posisi dan kondisi setiap
              pengguna selalu bisa Anda lihat.
            </p>

            <ul className="mt-7 flex flex-col gap-4">
              {KEUNGGULAN.map((k) => (
                <li key={k.judul} className="flex items-start gap-3.5">
                  <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-field ${k.warna}`}>
                    {k.ikon}
                  </span>
                  <span>
                    <b className="block text-base font-extrabold leading-6">{k.judul}</b>
                    <span className="mt-0.5 block text-sm leading-[21px] text-text-secondary">{k.isi}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="tentang" className="scroll-mt-[72px]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-18">
          <div>
            <h2 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[42px] lg:text-[48px]">
              Lalu, apa itu <span className="text-secondary">PENUNTUN</span>?
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-7 text-text-secondary">
              PENUNTUN adalah tongkat pintar yang membantu penyandang tunanetra berjalan lebih aman. Kameranya
              mengenali rintangan di depan dan menyampaikannya kepada pengguna lewat suara.
            </p>
            <p className="mt-3 max-w-md text-[17px] leading-7 text-text-secondary">
              Dashboard ini menampilkan lokasi, baterai, dan peringatan SOS dari tongkat secara langsung, sehingga
              pengguna dapat dipantau dari mana saja.
            </p>
          </div>

          <div className="relative pb-14">
            <Muncul className="relative aspect-[1280/858] overflow-hidden rounded-[40px] bg-surface shadow-[0_26px_44px_-28px_rgba(29,58,104,0.5)] lg:ml-24">
              <Image
                src="/landing-pemantauan.png"
                alt="Seseorang memantau lokasi tongkat lewat dashboard di laptop"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </Muncul>

            <Muncul
              tunda={250}
              className="absolute bottom-0 left-0 h-[150px] w-[150px] overflow-hidden rounded-[28px] bg-surface shadow-[0_0_0_8px_#F6F8FC,0_18px_34px_-18px_rgba(29,58,104,0.5)] sm:h-[190px] sm:w-[190px]"
            >
              <Image
                src="/landing-peta.png"
                alt="Detail peta satu perangkat"
                fill
                sizes="190px"
                className="object-cover"
              />
            </Muncul>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-0">
        <div className="mx-auto max-w-6xl px-6 pb-26 pt-24 text-center">
          <h2 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[42px] lg:text-[48px]">
            Bagaimana cara kerjanya?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[17px] leading-7 text-text-secondary">
            Dari tongkat di tangan pengguna sampai ke layar Anda.
          </p>

          <div className="mt-14 grid items-start gap-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-2">
            {LANGKAH.map((l, i) => (
              <Fragment key={l.judul}>
                <div className="flex flex-col items-center">
                  <div className="relative mb-5 text-primary">
                    <span className="flex h-20 w-20 items-center justify-center rounded-card bg-surface shadow-[0_18px_34px_-24px_rgba(29,58,104,0.4)]">
                      {l.ikon}
                    </span>
                    <span className="angka absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-pill bg-secondary text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold leading-7">{l.judul}</h3>
                  <p className="mt-1.5 max-w-xs text-[15px] leading-6 text-text-secondary">{l.isi}</p>
                </div>

                {i < LANGKAH.length - 1 && <PanahLangkah naik={i === 1} />}
              </Fragment>
            ))}
          </div>

          <div className="mt-14">
            <TombolUtama href="/register">Daftar sekarang</TombolUtama>
          </div>
        </div>
      </section>

      <footer className="bg-secondary text-on-dark">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo variant="putih" tinggi={28} />
            <p className="mt-3 max-w-[240px] text-sm leading-[22px] text-white/60">
              Dashboard pemantauan tongkat pintar untuk pengurus yayasan.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">Navigasi</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/75">
              {NAV.slice(0, 3).map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="transition-colors hover:text-white">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">Akun</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/75">
              <li>
                <Link href="/register" className="transition-colors hover:text-white">
                  Daftar
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Masuk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-6 py-6 text-xs text-white/50">
            <span>© 2026 PENUNTUN</span>
            <span>Dibuat oleh Althaf, Izac, dan Naufan, Universitas Diponegoro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}