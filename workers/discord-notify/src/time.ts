/** 台灣固定 UTC+8、無日光節約時間，直接以位移計算即可，避免依賴執行環境的時區設定。 */
const TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

/** 取得台灣當地日期（YYYY-MM-DD）。Cron 以 UTC 觸發，必須先換算才不會在跨日時算錯。 */
export function taiwanDate(now: Date): string {
  return new Date(now.getTime() + TAIWAN_OFFSET_MS).toISOString().slice(0, 10);
}

/** 以 UTC 午夜做日期加減，純日期運算不受時區影響。 */
export function addDays(date: string, days: number): string {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** 0 = 週日 … 6 = 週六 */
export function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** 例如 2026-11-06 → 11/06（五） */
export function formatDateLabel(date: string): string {
  return `${date.slice(5, 7)}/${date.slice(8, 10)}（${WEEKDAY_LABELS[weekdayIndex(date)]}）`;
}

/** 下週一到下週日；週日觸發時即為「明天起連續七天」。 */
export function nextWeekRange(today: string): { start: string; end: string } {
  const daysUntilNextMonday = ((8 - weekdayIndex(today)) % 7) || 7;
  const start = addDays(today, daysUntilNextMonday);
  return { start, end: addDays(start, 6) };
}
