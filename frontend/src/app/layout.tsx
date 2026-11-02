// frontend/src/app/layout.tsx

import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const fontUI = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
});

const fontData = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-data",
});

export const metadata = {
  title: "PENUNTUN",
  description: "Pemantauan tongkat pintar untuk sahabat tunanetra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fontUI.variable} ${fontData.variable}`} suppressHydrationWarning>
      <body
        className="bg-background text-text-primary"
        style={{ fontFamily: "var(--font-ui)" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}