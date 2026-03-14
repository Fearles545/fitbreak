import { format, subDays, eachDayOfInterval, isToday, startOfDay } from 'date-fns';
import { uk } from 'date-fns/locale';

/** Format date as YYYY-MM-DD in local timezone */
export function toDateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format date for display: "14 березня, п'ятниця" */
export function toDisplayDate(date: Date = new Date()): string {
  return format(date, "d MMMM, EEEE", { locale: uk });
}

/** Get array of dates for the last 7 days (including today), oldest first */
export function getLast7Days(today: Date = new Date()): Date[] {
  const start = subDays(startOfDay(today), 6);
  const end = startOfDay(today);
  return eachDayOfInterval({ start, end });
}

/** Check if a date is today */
export { isToday };
