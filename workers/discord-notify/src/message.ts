import { addDays, formatDateLabel } from './time';

export interface NotifyShift {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

export interface NotifyTodo {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  completed: boolean;
}

export interface NotifyItem {
  date: string;
  /** 排序用的開始時間，未設定時間者排在當天最後 */
  sortTime: string;
  text: string;
}

/** Discord 單則訊息上限 2000 字，保留餘裕避免剛好超長被拒絕。 */
const MESSAGE_LIMIT = 1900;

/** 待辦只在起訖日出現（與月曆、家庭同步的規則一致）；已完成者不通知。 */
export function todoItems(todos: NotifyTodo[], start: string, end: string): NotifyItem[] {
  const items: NotifyItem[] = [];
  for (const todo of todos) {
    if (todo.completed) continue;
    const first = todo.startDate || todo.endDate;
    const last = todo.endDate || todo.startDate;
    if (!first || !last || first > last) continue;
    const dates = first === last ? [first] : [first, last];
    for (const date of dates) {
      if (date < start || date > end) continue;
      const time = date === todo.startDate ? todo.startTime : todo.endTime;
      const label = first === last ? '' : date === first ? '開始' : '截止';
      items.push({
        date,
        sortTime: time || '99:99',
        text: `📝 ${time ? `${time} ` : ''}${label ? `[${label}] ` : ''}${todo.title}`,
      });
    }
  }
  return items;
}

export function shiftItems(shifts: NotifyShift[], start: string, end: string): NotifyItem[] {
  return shifts
    .filter((shift) => shift.date >= start && shift.date <= end)
    .map((shift) => ({
      date: shift.date,
      sortTime: shift.startTime || '99:99',
      text: `💼 ${shift.startTime}–${shift.endTime} ${shift.title}`,
    }));
}

function sortItems(items: NotifyItem[]): NotifyItem[] {
  return [...items].sort(
    (a, b) => a.date.localeCompare(b.date) || a.sortTime.localeCompare(b.sortTime) || a.text.localeCompare(b.text),
  );
}

/** 明日通知：沒有任何項目時回傳 null，避免每晚發送空訊息。 */
export function buildDailyMessage(date: string, items: NotifyItem[]): string | null {
  const dayItems = sortItems(items.filter((item) => item.date === date));
  if (dayItems.length === 0) return null;
  return [`📅 **明日行程 ${formatDateLabel(date)}**`, ...dayItems.map((item) => item.text)].join('\n');
}

/** 下週總覽：逐日列出，沒有安排的日子略過；整週皆空則明確告知。 */
export function buildWeeklyMessage(start: string, end: string, items: NotifyItem[]): string {
  const header = `🗓️ **下週行程總覽 ${formatDateLabel(start)} ~ ${formatDateLabel(end)}**`;
  const sorted = sortItems(items);
  if (sorted.length === 0) return `${header}\n下週目前沒有安排。`;
  const lines: string[] = [header];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const dayItems = sorted.filter((item) => item.date === date);
    if (dayItems.length === 0) continue;
    lines.push('', `**${formatDateLabel(date)}**`, ...dayItems.map((item) => item.text));
  }
  return lines.join('\n');
}

/** 依行切割長訊息，確保每段都不超過 Discord 限制。 */
export function splitMessage(text: string, limit: number = MESSAGE_LIMIT): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > limit && current) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
