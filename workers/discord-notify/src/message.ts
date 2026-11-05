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
  kind: 'shift' | 'todo';
  /** 排序用的開始時間，未設定時間者排在當天最後 */
  sortTime: string;
  /** 不含類型圖示的內容，由呈現端依版面決定是否加上圖示 */
  text: string;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  author: { name: string };
  fields?: { name: string; value: string }[];
}

export interface NotifyUser {
  uid: string;
  name: string;
}

/** 每位使用者固定一個顏色，讓同一頻道裡不同人的通知一眼可分。 */
const USER_COLORS = [0xb87e6b, 0x5f7186, 0x6b8e78, 0x886b86] as const;

/** Discord embed description 上限 4096 字，保留餘裕。 */
const DESCRIPTION_LIMIT = 3900;

const KIND_ICON = { shift: '💼', todo: '📝' } as const;

/** 解析 USER_UIDS：以逗號分隔，每項可寫成「uid=顯示名稱」；沒寫名稱時以 uid 前六碼代替。 */
export function parseUsers(raw: string): NotifyUser[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf('=');
      if (separator === -1) return { uid: entry, name: entry.slice(0, 6) };
      const uid = entry.slice(0, separator).trim();
      return { uid, name: entry.slice(separator + 1).trim() || uid.slice(0, 6) };
    })
    .filter((user) => user.uid);
}

export function userColor(index: number): number {
  return USER_COLORS[index % USER_COLORS.length];
}

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
        kind: 'todo',
        sortTime: time || '99:99',
        text: `${time ? `\`${time}\` ` : ''}${label ? `**[${label}]** ` : ''}${todo.title}`,
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
      kind: 'shift' as const,
      sortTime: shift.startTime || '99:99',
      text: `\`${shift.startTime}–${shift.endTime}\` ${shift.title}`,
    }));
}

function sortItems(items: NotifyItem[]): NotifyItem[] {
  return [...items].sort(
    (a, b) => a.date.localeCompare(b.date) || a.sortTime.localeCompare(b.sortTime) || a.text.localeCompare(b.text),
  );
}

/** 明日通知：依「打工班表 / 代辦行程」分成兩個區塊；沒有任何項目時回傳 null，避免每晚發送空訊息。 */
export function buildDailyEmbed(date: string, user: NotifyUser, color: number, items: NotifyItem[]): DiscordEmbed | null {
  const dayItems = sortItems(items.filter((item) => item.date === date));
  if (dayItems.length === 0) return null;
  const fields: { name: string; value: string }[] = [];
  const shifts = dayItems.filter((item) => item.kind === 'shift');
  const todos = dayItems.filter((item) => item.kind === 'todo');
  if (shifts.length > 0) fields.push({ name: `${KIND_ICON.shift} 打工班表`, value: shifts.map((item) => item.text).join('\n') });
  if (todos.length > 0) fields.push({ name: `${KIND_ICON.todo} 代辦行程`, value: todos.map((item) => item.text).join('\n') });
  return { title: `📅 明日行程　${formatDateLabel(date)}`, color, author: { name: user.name }, fields };
}

/** 下週總覽：逐日列出，沒有安排的日子略過；整週皆空則明確告知。 */
export function buildWeeklyEmbed(start: string, end: string, user: NotifyUser, color: number, items: NotifyItem[]): DiscordEmbed {
  const title = `🗓️ 下週行程總覽　${formatDateLabel(start)} ~ ${formatDateLabel(end)}`;
  const sorted = sortItems(items);
  if (sorted.length === 0) return { title, color, author: { name: user.name }, description: '下週目前沒有安排。' };
  const blocks: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const dayItems = sorted.filter((item) => item.date === date);
    if (dayItems.length === 0) continue;
    blocks.push([`**${formatDateLabel(date)}**`, ...dayItems.map((item) => `${KIND_ICON[item.kind]} ${item.text}`)].join('\n'));
  }
  let description = blocks.join('\n\n');
  if (description.length > DESCRIPTION_LIMIT) description = `${description.slice(0, DESCRIPTION_LIMIT)}\n…`;
  return { title, color, author: { name: user.name }, description };
}
