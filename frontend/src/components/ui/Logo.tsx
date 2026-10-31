// frontend/src/components/ui/Logo.tsx

import Image from "next/image";

export function Logo({ variant = "blue", size = 40 }: { variant?: "blue" | "white"; size?: number }) {
  const putih = variant === "white";

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={putih ? "/logo-white.png" : "/logo-blue.png"}
        alt="PENUNTUN"
        width={size}
        height={size}
        className="flex-shrink-0"
      />
      <span
        className={`text-xl font-extrabold tracking-[-0.03em] ${putih ? "text-white" : "text-secondary"}`}
      >
        PENUNTUN
      </span>
    </div>
  );
}