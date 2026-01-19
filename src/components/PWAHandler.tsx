'use client';
import { useEffect } from 'react';

/**
 * PWA Handler Component
 * 負責註冊 Service Worker
 */
export default function PWAHandler() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const basePath = process.env.NODE_ENV === 'production' ? '/schedule_app' : '';
        navigator.serviceWorker
          .register(`${basePath}/sw.js`)
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
