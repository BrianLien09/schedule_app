import { addCalendarDays, localDateKey } from '@/utils/agenda';

/**
 * 自製日期／時間選擇器共用的純函式。
 * 獨立成工具檔而不是寫在元件內：日期換算最容易在跨月、跨夜時出錯，抽出來才能用單元測試鎖住行為。
 */

const WEEKDAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 1440;

/**
 * 將 YYYY-MM-DD 解析成「本地時區」的午夜。
 * 不用 new Date('YYYY-MM-DD')：該寫法會被當成 UTC，台灣時區在月曆上會差一天。
 */
export function parseDateKey(key: string): Date | null {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // 2026-02-30 這類不存在的日期會被 Date 自動進位，比對回原字串即可擋下
  return localDateKey(date) === key ? date : null;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** YYYY-MM 字串的月份位移，薪資頁的月份切換使用 */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyOf(date: Date): string {
  return localDateKey(date).slice(0, 7);
}

/**
 * 產生月曆格：從該月第一天所在週的週一，排到最後一天所在週的週日。
 * 週一起算與學校課表、行程月曆一致，使用者不必切換閱讀習慣。
 */
export function buildMonthGrid(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const start = addCalendarDays(first, -((first.getDay() + 6) % 7));
  const end = addCalendarDays(last, (7 - last.getDay()) % 7);
  const days: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addCalendarDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

/** 與今天相差 -1～2 天時回傳口語標籤，讓使用者不必換算日期就知道選的是哪天 */
export function relativeDayLabel(key: string, today: Date): string | null {
  const date = parseDateKey(key);
  if (!date) return null;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((date.getTime() - base.getTime()) / 86_400_000);
  const labels: Record<number, string> = { [-1]: '昨天', 0: '今天', 1: '明天', 2: '後天' };
  return labels[diff] ?? null;
}

/** 觸發按鈕上的日期文字；同年省略年份，手機並排兩欄時才放得下 */
export function formatDateLabel(key: string, today: Date): string {
  const date = parseDateKey(key);
  if (!date) return '';
  const prefix = date.getFullYear() === today.getFullYear() ? '' : `${date.getFullYear()}年`;
  return `${prefix}${date.getMonth() + 1}月${date.getDate()}日 ${weekdayLabel(date)}`;
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function timeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** 分鐘數轉回 HH:mm；超過午夜時繞回 0 點，微調按鈕連按也不會產生 24:30 這種無效值 */
export function minutesToTime(total: number): string {
  const normalized = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

/** 時間後方的時段提示（凌晨／上午／下午／晚上），12 與 24 小時制的使用者都看得懂 */
export function periodLabel(value: string): string | null {
  const minutes = timeToMinutes(value);
  if (minutes === null) return null;
  const hour = Math.floor(minutes / 60);
  if (hour < 6) return '凌晨';
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}

/**
 * 計算起訖時間的時長文字。
 * allowOvernight 為 false 時（打工班表不允許跨夜），結束早於開始直接回傳 null，交給表單驗證提示。
 */
export function durationLabel(start: string, end: string, allowOvernight: boolean): string | null {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return null;
  const isOvernight = endMinutes < startMinutes;
  if (isOvernight && !allowOvernight) return null;
  const total = isOvernight ? endMinutes + MINUTES_PER_DAY - startMinutes : endMinutes - startMinutes;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const text = [hours > 0 ? `${hours} 小時` : '', minutes > 0 ? `${minutes} 分` : ''].filter(Boolean).join(' ');
  return `${isOvernight ? '跨夜，' : ''}共 ${text}`;
}
