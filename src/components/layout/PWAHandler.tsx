'use client';
import { useEffect } from 'react';

/**
 * PWA Handler Component
 * 負責註冊 Service Worker，並處理頁面已載入完成的情況
 */
export default function PWAHandler() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        const basePath = process.env.NODE_ENV === 'production' ? '/schedule_app' : '';
        const swUrl = `${basePath}/sw.js`;

        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log('Service Worker 註冊成功:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker 註冊失敗:', error);
          });
      };

      // 若 DOM 與 window 已經載入完成，直接執行註冊；否則監聽 load 事件
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}

