import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "我的日程與遊戲助手",
  description: "個人日程表與遊戲攻略整理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <Navbar />
        <main className="container" style={{ paddingTop: '1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
