// frontend/src/components/ui/Logo.tsx

import Image from "next/image";
import lockupBiru from "../../../public/logo-lockup-biru.png";
import lockupPutih from "../../../public/logo-lockup-putih.png";

export function Logo({ variant = "biru", tinggi = 32 }: { variant?: "biru" | "putih"; tinggi?: number }) {
  return (
    <Image
      src={variant === "putih" ? lockupPutih : lockupBiru}
      alt="PENUNTUN"
      height={tinggi}
      style={{ height: tinggi, width: "auto" }}
      priority
    />
  );
}