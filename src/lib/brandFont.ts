import { Caveat } from 'next/font/google';

/**
 * 品牌名稱「DayMate」的手寫草寫體。
 * 與 family-web 同樣使用 Caveat 700，兩個站並排時品牌字樣一致；只載入 latin 子集與單一字重，字型檔維持在數十 KB。
 * next/font 會在建置時下載並自架字型，GitHub Pages 靜態匯出也不必連 Google Fonts。
 */
export const brandFont = Caveat({ subsets: ['latin'], weight: ['700'], display: 'swap' });
