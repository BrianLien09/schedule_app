import type { TodoInput } from '@/data/todos';
import { localDateKey } from '@/utils/agenda';

export function roundedTodoDateTime(now: Date, interval: 30 | 60 = 30): { date: string; time: string } {
  const rounded = new Date(now);
  rounded.setHours(0, Math.round((now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60) / interval) * interval, 0, 0);
  return { date: localDateKey(rounded), time: `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}` };
}

export function defaultTodoDateTimes(now: Date): Pick<TodoInput, 'startDate' | 'endDate' | 'startTime' | 'endTime'> {
  const start = roundedTodoDateTime(now);
  const end = new Date(`${start.date}T${start.time}:00`);
  end.setMinutes(end.getMinutes() + 30);
  const finish = roundedTodoDateTime(end);
  return { startDate: start.date, startTime: start.time, endDate: finish.date, endTime: finish.time };
}
