'use client';
import { useEffect } from 'react';

/**
 * 開發模式下移除同源所有 Service Worker 註冊
 *
 * 為什麼：本專案與其他 Next.js 專案（如 family-web）在本機都跑 `next dev`，
 * 會輪流佔用 localhost:3000 / 3001。Service Worker 是綁在 origin（含 port）上的，
 * 任一專案留下的 scope `/` 註冊都會在另一個專案開發時繼續攔截請求，
 * 瀏覽器每次導覽也會對舊的腳本網址發出 update 檢查，造成反覆的 `GET /sw.js 404`。
 * 開發時也不需要離線快取，Network First 快取反而可能讓人看到舊的 chunk。
 */
async function unregisterDevServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return;

  const results = await Promise.all(registrations.map((registration) => registration.unregister()));
  const removedCount = results.filter(Boolean).length;
  console.info(`[PWA] 開發模式：已移除 ${removedCount} 個殘留的 Service Worker 註冊`);
}

/**
 * PWA Handler Component
 * 正式環境負責註冊 Service Worker；開發環境改為清除殘留註冊，不做任何 update 檢查
 */
export default function PWAHandler() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // 開發模式直接清除後結束，不註冊、不觸發 update，避免干擾同一 port 上的其他專案
    if (process.env.NODE_ENV !== 'production') {
      unregisterDevServiceWorkers().catch((error: unknown) => {
        console.warn('[PWA] 開發模式移除 Service Worker 失敗:', error);
      });
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register('/schedule_app/sw.js')
        .then((registration) => {
          console.log('Service Worker 註冊成功:', registration.scope);
        })
        .catch((error: unknown) => {
          console.error('Service Worker 註冊失敗:', error);
        });
    };

    // 若 DOM 與 window 已經載入完成，直接執行註冊；否則監聽 load 事件
    if (document.readyState === 'complete') {
      registerSW();
      return;
    }
    window.addEventListener('load', registerSW);
    return () => window.removeEventListener('load', registerSW);
  }, []);

  return null;
}
