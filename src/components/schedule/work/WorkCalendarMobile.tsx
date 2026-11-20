'use client';

import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type WorkRole } from '@/data/workRoles';
import type { WorkShift } from '@/data/schedule';
import type { Todo } from '@/data/todos';
import { formatTodoRange, getTodoColor } from '@/utils/todos';
import { getShiftColor } from '@/utils/shiftColors';
import { CheckIcon, PlusIcon } from '@/components/shared/Icons';
import styles from './WorkCalendarMobile.module.css';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
// 日期格最多畫三條色條；再多就改顯示「+N」，格子高度才固定，整個月曆不會被某一天撐高
const MAX_BARS = 3;

type BarStyle = CSSProperties & Record<'--bar-color', string>;

/** 色條顏色以 CSS 變數傳入，同一份樣式就能套在班次（實心）與代辦（淡色）兩種色條 */
function barStyle(color: string): BarStyle {
  return { '--bar-color': color };
}

interface DayItemSummary {
  key: string;
  color: string;
  isTodo: boolean;
}

interface WorkCalendarMobileProps {
  year: number;
  /** 1–12 */
  month: number;
  days: number;
  startDay: number;
  monthKey: string;
  monthDirection: 'previous' | 'next';
  todayDay: number | null;
  /** 下方「當日行程」顯示的日子 */
  agendaDay: number;
  isMultiSelectMode: boolean;
  selectedDays: number[];
  roles: WorkRole[];
  getShiftsForDate: (day: number) => WorkShift[];
  getTodosForDate: (day: number) => Todo[];
  onDayClick: (day: number, event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => void;
  onAddShift: (day: number) => void;
  onOpenEditShift: (shift: WorkShift) => void;
  onOpenEditTodo: (todo: Todo) => void;
}

function shiftTitle(shift: WorkShift): string {
  return shift.shiftCategory || shift.note || '打工';
}

/**
 * 手機版行程月曆：格子只放日期與色條，細節移到下方「當日行程」卡片。
 * 為什麼不沿用桌面格子：手機一格只有約 46px 寬，班別名稱只剩「助教班…」三個字，
 * 加上每格的 + 按鈕與虛線框，整個月看起來像一堆碎片；改成色條後一眼看出哪幾天有班、是哪一種班。
 */
export default function WorkCalendarMobile({
  year,
  month,
  days,
  startDay,
  monthKey,
  monthDirection,
  todayDay,
  agendaDay,
  isMultiSelectMode,
  selectedDays,
  roles,
  getShiftsForDate,
  getTodosForDate,
  onDayClick,
  onAddShift,
  onOpenEditShift,
  onOpenEditTodo,
}: WorkCalendarMobileProps) {
  const agendaShifts = getShiftsForDate(agendaDay);
  const agendaTodos = getTodosForDate(agendaDay);
  const agendaWeekday = WEEKDAYS[(new Date(year, month - 1, agendaDay).getDay() + 6) % 7];
  const agendaHours = agendaShifts.reduce((sum, shift) => sum + (shift.workHours ?? 0), 0);
  const agendaPay = agendaShifts.reduce(
    (sum, shift) => sum + (shift.workHours ?? 0) * (shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role, roles)),
    0,
  );

  return (
    <>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((label, index) => (
          <span key={label} className={index >= 5 ? styles.weekend : undefined}>{label}</span>
        ))}
      </div>

      <div
        key={monthKey}
        className={`${styles.grid} ${monthDirection === 'previous' ? styles.gridPrevious : styles.gridNext}`}
      >
        {Array.from({ length: startDay }).map((_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}

        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          const items: DayItemSummary[] = [
            ...getShiftsForDate(day).map((shift) => ({
              key: shift.id,
              color: getShiftColor(shiftTitle(shift), shift.role).backgroundColor,
              isTodo: false,
            })),
            ...getTodosForDate(day).map((todo) => ({ key: todo.id, color: getTodoColor(todo), isTodo: true })),
          ];
          const isWeekend = (startDay + index) % 7 >= 5;
          const isToday = todayDay === day;
          const isPicked = isMultiSelectMode && selectedDays.includes(day);
          // 多選模式時改由勾選狀態主導，避免「當日行程」的實心圓和勾選混在一起
          const isAgenda = !isMultiSelectMode && agendaDay === day;
          const overflow = items.length - MAX_BARS;

          return (
            <button
              key={day}
              type="button"
              className={[
                styles.cell,
                isWeekend ? styles.cellWeekend : '',
                isToday ? styles.cellToday : '',
                isAgenda ? styles.cellActive : '',
                isPicked ? styles.cellPicked : '',
              ].join(' ')}
              aria-pressed={isMultiSelectMode ? isPicked : isAgenda}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${isToday ? '今天，' : ''}${month} 月 ${day} 日${items.length ? `，${items.length} 個行程` : ''}`}
              onClick={(event) => onDayClick(day, event)}
            >
              <span className={styles.dayNumber}>
                {isPicked ? <CheckIcon size={14} /> : day}
              </span>
              <span className={styles.bars} aria-hidden="true">
                {items.slice(0, MAX_BARS).map((item) => (
                  <span
                    key={item.key}
                    className={`${styles.bar} ${item.isTodo ? styles.barTodo : ''}`}
                    style={barStyle(item.color)}
                  />
                ))}
                {overflow > 0 && <span className={styles.barMore}>+{overflow}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {!isMultiSelectMode && (
        <section key={`${monthKey}-${agendaDay}`} className={styles.agenda} aria-label={`${month} 月 ${agendaDay} 日行程`}>
          <header className={styles.agendaHeader}>
            <div className={styles.agendaDate}>
              <span className={styles.agendaDayNumber}>{agendaDay}</span>
              <span className={styles.agendaDateText}>
                <span className={styles.agendaWeekday}>
                  週{agendaWeekday}
                  {todayDay === agendaDay && <span className={styles.agendaToday}>今天</span>}
                </span>
                <span className={styles.agendaMonth}>{year} 年 {month} 月</span>
              </span>
            </div>
            <button type="button" className={styles.agendaAdd} onClick={() => onAddShift(agendaDay)}>
              <PlusIcon size={16} />
              新增
            </button>
          </header>

          {agendaShifts.length === 0 && agendaTodos.length === 0 ? (
            <p className={styles.agendaEmpty}>這天還沒有行程，點右上角「新增」排班或加代辦。</p>
          ) : (
            <ul className={styles.agendaList}>
              {agendaShifts.map((shift) => {
                const title = shiftTitle(shift);
                const rate = shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role, roles);
                return (
                  <li key={shift.id}>
                    <button
                      type="button"
                      className={styles.agendaItem}
                      style={barStyle(getShiftColor(title, shift.role).backgroundColor)}
                      onClick={() => onOpenEditShift(shift)}
                    >
                      <span className={styles.agendaTime}>
                        <strong>{shift.startTime}</strong>
                        <span>{shift.endTime}</span>
                      </span>
                      <span className={styles.agendaBody}>
                        <span className={styles.agendaTitle}>{title}</span>
                        <span className={styles.agendaMeta}>
                          {getWorkRoleLabel(shift.role, roles, shift.roleName)} · ${rate}/h · {shift.workHours ?? '-'} 小時
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {agendaTodos.map((todo) => (
                <li key={todo.id}>
                  <button
                    type="button"
                    className={`${styles.agendaItem} ${styles.agendaItemTodo} ${todo.completed ? styles.agendaItemDone : ''}`}
                    style={barStyle(getTodoColor(todo))}
                    onClick={() => onOpenEditTodo(todo)}
                  >
                    <span className={styles.agendaTime}>
                      <strong>代辦</strong>
                    </span>
                    <span className={styles.agendaBody}>
                      <span className={styles.agendaTitle}>{todo.title}</span>
                      <span className={styles.agendaMeta}>{formatTodoRange(todo)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {agendaShifts.length > 0 && (
            <footer className={styles.agendaFooter}>
              <span>共 {Number(agendaHours.toFixed(2))} 小時</span>
              <strong>預估 NT$ {Math.round(agendaPay).toLocaleString()}</strong>
            </footer>
          )}
        </section>
      )}
    </>
  );
}
