import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import BackToTop from "@/components/BackToTop";
import PWAHandler from "@/components/PWAHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "DayMate - 個人日程與薪資管理",
  description: "課程表、打工班表、薪資計算與個人生活管理助手",
  icons: {
    icon: './icon.png',
  },
  manifest: './manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DayMate',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f111a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <Providers>
          <PWAHandler />
          <Navbar />
          <main className="container page-transition" style={{ paddingTop: '1rem' }}>
            {children}
          </main>
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
