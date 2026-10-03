import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type Props = {
  photoSrc: string;
  photoPosition?: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaHref: string;
  ctaLabel: string;
};

export function AuthVisualPanel({
  photoSrc,
  photoPosition = "center",
  eyebrow,
  headline,
  subheadline,
  ctaHref,
  ctaLabel,
}: Props) {
  return (
    <div className="relative hidden h-full w-full overflow-hidden rounded-[2.5rem] bg-secondary md:block">
      <Image src={photoSrc} alt="" fill priority className="object-cover" style={{ objectPosition: photoPosition }} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-secondary via-secondary/60 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <Image src="/logo-blue.png" alt="PENUNTUN" width={40} height={40} />
          <Link
            href={ctaHref}
            className="flex items-center gap-1.5 rounded-pill bg-white px-5 py-2.5 text-sm font-semibold text-secondary shadow-card transition-colors hover:bg-white/90"
          >
            {ctaLabel} <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="max-w-sm">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/60">{eyebrow}</span>
          <h2 className="text-3xl font-bold leading-tight text-white">{headline}</h2>
          <p className="mt-3 text-sm text-white/75">{subheadline}</p>
        </div>
      </div>
    </div>
  );
}