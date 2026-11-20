import type { Metadata, Viewport } from "next";
import Providers from "@/components/layout/Providers";
import BottomNav from '@/components/layout/BottomNav';
import Navbar from "@/components/layout/Navbar";
import BackToTop from "@/components/layout/BackToTop";
import PWAHandler from "@/components/layout/PWAHandler";
import PageTransition from "@/components/layout/PageTransition";
import DataSyncStatus from "@/components/layout/DataSyncStatus";
import "./globals.css";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/schedule_app" : "";
// 圖示更新時遞增，避免瀏覽器與 PWA 繼續顯示快取的舊圖示
const APP_ASSET_VERSION = "3";

export const metadata: Metadata = {
  title: "DayMate",
  description: "課程表、打工班表、薪資計算與個人生活管理助手",
  // favicon.ico（16/32/48）由 src/app/favicon.ico 自動提供；這裡補高解析 PNG 與 iOS 主畫面圖示
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon-192.png?v=${APP_ASSET_VERSION}`, sizes: '192x192', type: 'image/png' },
      { url: `${BASE_PATH}/icon-512.png?v=${APP_ASSET_VERSION}`, sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: `${BASE_PATH}/apple-touch-icon.png?v=${APP_ASSET_VERSION}`, sizes: '180x180' },
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
            <DataSyncStatus />
            <PageTransition>{children}</PageTransition>
          </main>
          <BackToTop />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
