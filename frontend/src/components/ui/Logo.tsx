import Image from "next/image";
import { Montserrat } from "next/font/google";

const display = Montserrat({ subsets: ["latin"], weight: ["700"] });

type Props = {
  variant?: "blue" | "white";
  size?: number;
};

export function Logo({ variant = "blue", size = 40 }: Props) {
  const src = variant === "white" ? "/logo-white.png" : "/logo-blue.png";
  const textColor = variant === "white" ? "text-white" : "text-primary";
  const nudge = variant === "white" ? "translate-y-[4px]" : "translate-y-[1px]";

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={src}
        alt="PENUNTUN"
        width={size}
        height={size}
        className={`flex-shrink-0 ${nudge}`}
      />
      <span className={`${display.className} text-xl font-bold italic ${textColor}`}>PENUNTUN</span>
    </div>
  );
}