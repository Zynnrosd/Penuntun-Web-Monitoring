// frontend/src/components/ui/Muncul.tsx

"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  tunda?: number;
};

export function Muncul({ children, className = "", tunda = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setTerlihat(true);
      return;
    }

    const pengamat = new IntersectionObserver(
      ([entri]) => {
        if (entri.isIntersecting) {
          setTerlihat(true);
          pengamat.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${tunda}ms` }}
      className={`transition-[opacity,translate,scale] duration-700 ease-out [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out hover:[&_img]:scale-105 ${
        terlihat ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-[0.96] opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}