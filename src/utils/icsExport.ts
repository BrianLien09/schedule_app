/**
 * 產生並下載 iCalendar (.ics) 檔案
 * 支援將課表與打工班表匯出至手機原生行事曆 (Apple Calendar, Google Calendar 等)
 */

export interface CalendarEventItem {
  title: string;
  description?: string;
  location?: string;
  startDate: Date; // 開始時間
  endDate: Date;   // 結束時間
}

/**
 * 將 Date 物件格式化為 ICS 要求的 UTC 時間字串 (YYYYMMDDTHHMMSSZ)
 */
function formatICSTime(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * 轉義 ICS 文字中的特殊符號
 */
function escapeICSText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * 匯出 ICS 檔案並觸發瀏覽器下載
 */
export function exportToICS(calendarTitle: string, events: CalendarEventItem[], filename: string): void {
  if (!events || events.length === 0) return;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScheduleApp//NONSGML Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarTitle)}`,
    'X-WR-TIMEZONE:Asia/Taipei',
  ].join('\r\n');

  events.forEach((evt, idx) => {
    const uid = `schedule-app-${Date.now()}-${idx}@schedule.app`;
    const dtStart = formatICSTime(evt.startDate);
    const dtEnd = formatICSTime(evt.endDate);
    const summary = escapeICSText(evt.title);
    const description = evt.description ? escapeICSText(evt.description) : '';
    const location = evt.location ? escapeICSText(evt.location) : '';

    icsContent += '\r\n' + [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSTime(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      location ? `LOCATION:${location}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });

  icsContent += '\r\nEND:VCALENDAR';

  // 建立 Blob 並觸發下載
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
