import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fontUI = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ui" });
const fontData = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-data" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fontUI.variable} ${fontData.variable}`} suppressHydrationWarning>
      <body className="bg-background text-text-primary" style={{ fontFamily: "var(--font-ui)" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}