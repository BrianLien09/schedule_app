import type { Metadata, Viewport } from "next";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import BackToTop from "@/components/layout/BackToTop";
import PWAHandler from "@/components/layout/PWAHandler";
import PageTransition from "@/components/layout/PageTransition";
import "./globals.css";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/schedule_app" : "";
const APP_ASSET_VERSION = "2";

export const metadata: Metadata = {
  title: "DayMate",
  description: "課程表、打工班表、薪資計算與個人生活管理助手",
  icons: {
    icon: `${BASE_PATH}/icon.png?v=${APP_ASSET_VERSION}`,
  },
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DayMate',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#e6e2d8',
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
          <main className="container site-main">
            <PageTransition>{children}</PageTransition>
          </main>
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
