import { Course, WorkShift, Event } from '../data/schedule';

/**
 * ICS Calendar Export Utilities
 * 用於匯出課表、打工班表和事件為 .ics 格式
 */

// 格式化日期時間為 ICS 格式 (YYYYMMDDTHHMMSS)
function formatICSDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

// 格式化日期為 ICS 日期格式 (YYYYMMDD)
function formatICSDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 轉換星期幾為 ICS 的 BYDAY 格式
function getDayOfWeek(day: number): string {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[day === 7 ? 0 : day];
}

// 計算學期結束日期 (預設 18 週)
function getSemesterEndDate(): string {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 18 * 7); // 18 週
  return formatICSDate(endDate.toISOString().split('T')[0]);
}

/**
 * 匯出課程為 ICS 格式
 */
export function exportCoursesToICS(courses: Course[]): string {
  const now = new Date();
  const timestamp = formatICSDateTime(now);
  const semesterEnd = getSemesterEndDate();

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//冥夜小助手//Course Schedule//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:我的課表',
    'X-WR-TIMEZONE:Asia/Taipei',
  ].join('\r\n');

  courses.forEach((course) => {
    const [startHour, startMin] = course.startTime.split(':');
    const [endHour, endMin] = course.endTime.split(':');
    
    // 計算本週對應的日期
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = course.day === 7 ? 0 : course.day;
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const startDateTime = new Date(targetDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0);
    
    const endDateTime = new Date(targetDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0);

    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:${course.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDateTime(startDateTime)}`,
      `DTEND:${formatICSDateTime(endDateTime)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${getDayOfWeek(course.day)};UNTIL=${semesterEnd}`,
      `SUMMARY:${course.name}`,
      course.location ? `LOCATION:${course.location}` : '',
      `DESCRIPTION:課程：${course.name}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');

    icsContent += event;
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

/**
 * 匯出打工班表為 ICS 格式
 */
export function exportWorkShiftsToICS(shifts: WorkShift[]): string {
  const now = new Date();
  const timestamp = formatICSDateTime(now);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//冥夜小助手//Work Schedule//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:我的打工班表',
    'X-WR-TIMEZONE:Asia/Taipei',
  ].join('\r\n');

  shifts.forEach((shift) => {
    const [startHour, startMin] = shift.startTime.split(':');
    const [endHour, endMin] = shift.endTime.split(':');
    
    const startDateTime = new Date(`${shift.date}T${shift.startTime}`);
    const endDateTime = new Date(`${shift.date}T${shift.endTime}`);

    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:${shift.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDateTime(startDateTime)}`,
      `DTEND:${formatICSDateTime(endDateTime)}`,
      `SUMMARY:${shift.note || '打工'}`,
      `DESCRIPTION:打工班表：${shift.note || '工作'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].join('\r\n');

    icsContent += event;
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

/**
 * 匯出重要事件為 ICS 格式
 */
export function exportEventsToICS(events: Event[]): string {
  const now = new Date();
  const timestamp = formatICSDateTime(now);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//冥夜小助手//Important Events//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:重要事件',
    'X-WR-TIMEZONE:Asia/Taipei',
  ].join('\r\n');

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    const dateStr = formatICSDate(event.date);

    const vevent = [
      '',
      'BEGIN:VEVENT',
      `UID:${event.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      'STATUS:CONFIRMED',
      event.type === 'deadline' ? 'PRIORITY:1' : 'PRIORITY:5',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');

    icsContent += vevent;
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

/**
 * 匯出所有資料為單一 ICS 檔案
 */
export function exportAllToICS(
  courses: Course[],
  shifts: WorkShift[],
  events: Event[]
): string {
  const now = new Date();
  const timestamp = formatICSDateTime(now);
  const semesterEnd = getSemesterEndDate();

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//冥夜小助手//Complete Schedule//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:我的完整行程',
    'X-WR-TIMEZONE:Asia/Taipei',
  ].join('\r\n');

  // 加入課程
  courses.forEach((course) => {
    const [startHour, startMin] = course.startTime.split(':');
    const [endHour, endMin] = course.endTime.split(':');
    
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = course.day === 7 ? 0 : course.day;
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const startDateTime = new Date(targetDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0);
    
    const endDateTime = new Date(targetDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0);

    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:course-${course.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDateTime(startDateTime)}`,
      `DTEND:${formatICSDateTime(endDateTime)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${getDayOfWeek(course.day)};UNTIL=${semesterEnd}`,
      `SUMMARY:📚 ${course.name}`,
      course.location ? `LOCATION:${course.location}` : '',
      `DESCRIPTION:課程：${course.name}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'CATEGORIES:課程',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');

    icsContent += event;
  });

  // 加入打工班表
  shifts.forEach((shift) => {
    const startDateTime = new Date(`${shift.date}T${shift.startTime}`);
    const endDateTime = new Date(`${shift.date}T${shift.endTime}`);

    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:work-${shift.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDateTime(startDateTime)}`,
      `DTEND:${formatICSDateTime(endDateTime)}`,
      `SUMMARY:💼 ${shift.note || '打工'}`,
      `DESCRIPTION:打工班表：${shift.note || '工作'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'CATEGORIES:打工',
      'END:VEVENT',
    ].join('\r\n');

    icsContent += event;
  });

  // 加入重要事件
  events.forEach((event) => {
    const dateStr = formatICSDate(event.date);

    const vevent = [
      '',
      'BEGIN:VEVENT',
      `UID:event-${event.id}@schedule-app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:⚡ ${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      'STATUS:CONFIRMED',
      event.type === 'deadline' ? 'PRIORITY:1' : 'PRIORITY:5',
      'CATEGORIES:重要事件',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');

    icsContent += vevent;
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

/**
 * 下載 ICS 檔案
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
