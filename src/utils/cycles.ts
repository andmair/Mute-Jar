export type CycleFrequency = 'weekly' | 'fortnightly' | 'monthly';

export interface CycleInfo {
  key: string;
  label: string;
  frequency: CycleFrequency;
  startTimestamp: number;
  endTimestamp: number;
  daysRemaining: number;
}

/**
 * Returns ISO week number for a given date
 */
export function getISOWeekNumber(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/**
 * Computes active cycle information for weekly, fortnightly, or monthly intervals
 */
export function getCurrentCycleInfo(
  frequency: CycleFrequency = 'monthly',
  now: Date = new Date()
): CycleInfo {
  if (frequency === 'weekly') {
    const { year, week } = getISOWeekNumber(now);
    // Start of week (Monday)
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startMonth = startOfWeek.toLocaleString('default', { month: 'short' });
    const endMonth = endOfWeek.toLocaleString('default', { month: 'short' });
    const rangeLabel =
      startMonth === endMonth
        ? `${startMonth} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`
        : `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;

    const daysRemaining = Math.max(0, Math.ceil((endOfWeek.getTime() - now.getTime()) / 86400000));

    return {
      key: `${year}-W${String(week).padStart(2, '0')}`,
      label: `Week ${week} (${rangeLabel})`,
      frequency: 'weekly',
      startTimestamp: startOfWeek.getTime(),
      endTimestamp: endOfWeek.getTime(),
      daysRemaining,
    };
  }

  if (frequency === 'fortnightly') {
    const { year, week } = getISOWeekNumber(now);
    const fortnightNum = Math.ceil(week / 2);

    // Determine start of fortnight (even vs odd week)
    const isSecondWeek = week % 2 === 0;
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfFortnight = new Date(startOfThisWeek);
    if (isSecondWeek) {
      startOfFortnight.setDate(startOfFortnight.getDate() - 7);
    }

    const endOfFortnight = new Date(startOfFortnight);
    endOfFortnight.setDate(startOfFortnight.getDate() + 13);
    endOfFortnight.setHours(23, 59, 59, 999);

    const startMonth = startOfFortnight.toLocaleString('default', { month: 'short' });
    const endMonth = endOfFortnight.toLocaleString('default', { month: 'short' });
    const rangeLabel =
      startMonth === endMonth
        ? `${startMonth} ${startOfFortnight.getDate()} – ${endOfFortnight.getDate()}, ${startOfFortnight.getFullYear()}`
        : `${startMonth} ${startOfFortnight.getDate()} – ${endMonth} ${endOfFortnight.getDate()}, ${endOfFortnight.getFullYear()}`;

    const daysRemaining = Math.max(0, Math.ceil((endOfFortnight.getTime() - now.getTime()) / 86400000));

    return {
      key: `${year}-FN${String(fortnightNum).padStart(2, '0')}`,
      label: `Fortnight ${fortnightNum} (${rangeLabel})`,
      frequency: 'fortnightly',
      startTimestamp: startOfFortnight.getTime(),
      endTimestamp: endOfFortnight.getTime(),
      daysRemaining,
    };
  }

  // Monthly default
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthName = now.toLocaleString('default', { month: 'long' });

  const daysRemaining = Math.max(0, Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000));

  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: `${monthName} ${year}`,
    frequency: 'monthly',
    startTimestamp: startOfMonth.getTime(),
    endTimestamp: endOfMonth.getTime(),
    daysRemaining,
  };
}

export function isTimestampInCycle(timestamp: number, cycle: CycleInfo): boolean {
  return timestamp >= cycle.startTimestamp && timestamp <= cycle.endTimestamp;
}

export function getCycleNoun(frequency: CycleFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'Week';
    case 'fortnightly':
      return 'Fortnight';
    case 'monthly':
      return 'Month';
  }
}
