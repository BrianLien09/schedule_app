import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import PWAHandler from "@/components/PWAHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "冥夜小助手",
  description: "個人日程表與遊戲攻略整理",
  icons: {
    icon: '/schedule_app/icon.jpg',
  },
  manifest: '/schedule_app/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '冥夜小助手',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#8b5cf6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <PWAHandler />
        <Navbar />
        <main className="container" style={{ paddingTop: '1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
