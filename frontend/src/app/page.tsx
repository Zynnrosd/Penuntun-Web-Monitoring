import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { ArrowRight, Camera, Brain, Volume2, MapPin, Siren, Users, Radio, CircleDot } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const display = Montserrat({ subsets: ["latin"], weight: ["600", "700"] });

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 h-[76px] bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Logo variant="blue" />
            
          <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
            <a href="#home" className={`transition-colors hover:text-primary ${focusRing}`}>Home</a>
            <a href="#fitur" className={`transition-colors hover:text-primary ${focusRing}`}>Fitur</a>
            <a href="#cara-kerja" className={`transition-colors hover:text-primary ${focusRing}`}>Cara Kerja</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-medium text-text-primary hover:text-primary ${focusRing}`}>
              Masuk
            </Link>
            <Link href="/register" className={`rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-md shadow-primary/30 hover:bg-primary-hover ${focusRing}`}>
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — foto besar lagi, tepi atas memudar (gradasi) jadi tidak nabrak header */}
      <section id="home" className="relative flex min-h-[calc(100vh-76px)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-8 lg:grid-cols-2">
          <div className="animate-fade-up">
            <h1 className={`${display.className} text-4xl font-bold leading-[1.15] text-text-primary md:text-5xl`}>
              Tongkat pintar untuk langkah yang lebih aman
            </h1>
            <p className="mt-6 max-w-sm leading-relaxed text-text-secondary">
              PENUNTUN mendeteksi rintangan di depan penyandang tunanetra, dan memberi yayasan atau
              keluarga cara memantau lokasi serta sinyal darurat secara real-time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={`inline-flex items-center gap-2 rounded-input bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/30 hover:bg-primary-hover ${focusRing}`}
              >
                Daftar Sekarang <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className={`inline-flex items-center rounded-input border border-border px-6 py-3.5 text-sm font-semibold text-text-primary hover:bg-surface ${focusRing}`}
              >
                Masuk
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[360px] w-full max-w-lg sm:h-[480px] lg:h-[min(74vh,680px)]">
            <div
              className="absolute inset-0 overflow-hidden rounded-[3rem] shadow-xl shadow-text-primary/10"
              style={{
                WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 90%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 90%, transparent 100%)",
              }}
            >
              <Image src="/auth-login.png" alt="Pengguna PENUNTUN berjalan di trotoar" fill className="object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD — foto melengkung dari tepi kiri + mockup panel, teks di kanan */}
      <section id="fitur" className="relative py-20 lg:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[420px]">
            <div className="absolute inset-y-0 -left-6 right-1/3 overflow-hidden rounded-r-full lg:-left-[calc((100vw-72rem)/2+1.5rem)]">
              <Image
                src="/auth-register.png"
                alt="Pengguna PENUNTUN berjalan di area perkotaan"
                fill
                className="object-cover object-[center_15%]"
              />
            </div>

            {/* Mockup panel dashboard — ilustrasi, status selalu ikon + teks, merah hanya untuk SOS */}
            <figure aria-hidden="true" className="relative ml-auto mt-10 w-full max-w-sm -rotate-3 rounded-[28px] border border-border bg-white p-4 shadow-2xl shadow-text-primary/20">
              <figcaption className="flex items-center justify-between px-1 pb-3">
                <span className="text-sm font-semibold text-text-primary">Pemantauan</span>
                <span className="text-xs text-text-secondary">Contoh tampilan</span>
              </figcaption>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-input bg-surface p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"><MapPin size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">Pak Budi, PNT-01</p>
                    <p className="text-xs text-text-secondary">Jl. Pahlawan — Live</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <Radio size={11} /> Online
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-input border border-danger/30 bg-danger/5 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/10 text-danger"><Siren size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">Tombol SOS ditekan</p>
                    <p className="text-xs text-text-secondary">Pak Budi, 2 menit lalu</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-xs font-medium text-white">
                    <Siren size={11} /> SOS
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-input bg-surface p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-offline/10 text-offline"><MapPin size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">Bu Sari, PNT-04</p>
                    <p className="text-xs text-text-secondary">Terakhir terlihat 18 menit lalu</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-offline/10 px-2 py-0.5 text-xs font-medium text-offline">
                    <CircleDot size={11} /> Offline
                  </span>
                </div>
              </div>
            </figure>
          </div>

          <div>
            <h2 className={`${display.className} text-3xl font-bold leading-tight text-text-primary md:text-4xl`}>
              Ingin tahu mereka baik-baik saja?
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-text-secondary">
              Dengan dashboard <span className="font-medium text-primary">PENUNTUN</span>, posisi dan kondisi
              setiap pengguna selalu bisa Anda lihat.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              {[
                { icon: <MapPin size={15} />, teks: "Lokasi real-time, dengan waktu terakhir terlihat saat offline" },
                { icon: <Siren size={15} />, teks: "Notifikasi SOS ke dashboard dan WhatsApp bersamaan" },
                { icon: <Users size={15} />, teks: "Beberapa yayasan dalam satu platform, data terpisah penuh" },
              ].map((f) => (
                <li key={f.teks} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-primary">{f.icon}</span>
                  {f.teks}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CARA KERJA — tiga ikon bulat */}
      <section id="cara-kerja" className="py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Cara Kerja</span>
          <h2 className={`${display.className} mt-2 text-3xl font-bold text-text-primary`}>Bagaimana cara kerjanya?</h2>

          <div className="relative mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-border sm:block" />
            {[
              { icon: <Camera size={26} />, judul: "Tangkap visual", teks: "Kamera membaca kondisi jalan di depan pengguna." },
              { icon: <Brain size={26} />, judul: "Deteksi AI lokal", teks: "Lubang, tangga, dan kendaraan dikenali di perangkat." },
              { icon: <Volume2 size={26} />, judul: "Peringatan suara", teks: "Instruksi audio sebelum rintangan tersentuh." },
            ].map((s, i) => (
              <div key={s.judul} className="relative flex flex-col items-center">
                <span className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 ring-8 ring-background">
                  {s.icon}
                </span>
                <span className="mt-4 font-mono text-xs text-text-secondary">0{i + 1}</span>
                <h3 className="mt-1.5 font-semibold text-text-primary">{s.judul}</h3>
                <p className="mt-2 max-w-[14rem] text-sm text-text-secondary">{s.teks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER — navy dongker, 3 kolom */}
      <footer id="tentang" className="mt-10 bg-secondary">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo variant="white" size={36} />
          
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/60">
              Navigasi berbasis AI dan pemantauan real-time untuk kemandirian penyandang tunanetra.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">Navigasi</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><a href="#home" className="transition-colors hover:text-white">Home</a></li>
              <li><a href="#fitur" className="transition-colors hover:text-white">Fitur</a></li>
              <li><a href="#cara-kerja" className="transition-colors hover:text-white">Cara Kerja</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">Akun</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/register" className="transition-colors hover:text-white">Daftar</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-white">Masuk</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-white/45 md:flex-row">
            <p>© 2026 PENUNTUN</p>
            <p>Althaf, Izac, Naufan Universitas Diponegoro</p>
          </div>
        </div>
      </footer>
    </div>
  );
}