import { RecurringFrequency } from '@/types/finance';

/**
 * Calculates the next occurrence date given a current date string (YYYY-MM-DD)
 * and frequency ('weekly' | 'monthly' | 'yearly'), preventing month-end date overflow.
 */
export function advanceNextDate(currentDateStr: string, frequency: RecurringFrequency | string): string {
  if (!currentDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(currentDateStr)) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const [yearStr, monthStr, dayStr] = currentDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  if (frequency === 'weekly') {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().split('T')[0];
  }

  if (frequency === 'monthly') {
    // Next month: 0-indexed month is (month - 1) + 1 = month
    const targetMonthIndex = month % 12; // 0 for Jan, 11 for Dec
    const targetYear = month === 12 ? year + 1 : year;
    // Get last day of target month: Date.UTC(targetYear, targetMonthIndex + 1, 0)
    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
    const finalDay = Math.min(day, daysInTargetMonth);
    const d = new Date(Date.UTC(targetYear, targetMonthIndex, finalDay));
    return d.toISOString().split('T')[0];
  }

  if (frequency === 'yearly') {
    const targetYear = year + 1;
    const daysInTargetMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
    const finalDay = Math.min(day, daysInTargetMonth);
    const d = new Date(Date.UTC(targetYear, month - 1, finalDay));
    return d.toISOString().split('T')[0];
  }

  // Default fallback: advance 1 month
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().split('T')[0];
}

export type DueStatusType = 'overdue' | 'today' | 'due_soon' | 'upcoming';

export interface DueStatus {
  status: DueStatusType;
  days: number;
  label: string;
}

/**
 * Determines whether a bill is overdue, due today, due soon (<= 7 days), or upcoming.
 */
export function getBillDueStatus(nextDate: string, referenceDateStr?: string): DueStatus {
  const ref = referenceDateStr || new Date().toISOString().split('T')[0];
  const refTime = new Date(ref + 'T00:00:00Z').getTime();
  const nextTime = new Date(nextDate + 'T00:00:00Z').getTime();
  const diffDays = Math.round((nextTime - refTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      days: Math.abs(diffDays),
      label: `${Math.abs(diffDays)}d overdue`,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      days: 0,
      label: 'Due today',
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'due_soon',
      days: diffDays,
      label: `Due in ${diffDays}d`,
    };
  }

  return {
    status: 'upcoming',
    days: diffDays,
    label: `In ${diffDays}d`,
  };
}
