import type { IActionPlan, IGoal } from "../types";

export function getQuarter(month: number): number {
  if (month >= 1 && month <= 3) return 1;   // Q1: Jan–Mar
  if (month >= 4 && month <= 6) return 2;   // Q2: Apr–Jun
  if (month >= 7 && month <= 9) return 3;   // Q3: Jul–Sep
  return 4;                                 // Q4: Oct–Dec
}

export function getQuarterEnd(year: number, quarter: number): Date {
  switch (quarter) {
    case 1: return new Date(year, 2, 31);  // 31/3
    case 2: return new Date(year, 5, 30);  // 30/6
    case 3: return new Date(year, 8, 30);  // 30/9
    case 4: return new Date(year, 11, 31); // 31/12
    default: throw new Error("Invalid quarter");
  }
}

export function getHalfYearEnd(year: number, month: number): Date {
  return month < 6
    ? new Date(year, 5, 30)   // H1: Jan–Jun
    : new Date(year, 11, 31); // H2: Jul–Dec
}

export function getHalfYearRollingEnd(start: Date): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  end.setDate(end.getDate() - 1);
  return end;
}

export function getQuarterFromDate(dateString: string): string {
  const month = new Date(dateString).getMonth() + 1;
  const quarterNumber = Math.floor((month - 1) / 3) + 1;
  return `Q${quarterNumber}`;
}

export function getHalfYearLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getFullYear()}/${start.getMonth() + 1} - ${end.getFullYear()}/${end.getMonth() + 1}`;
}

export function validateForm(data: typeof FormData) {
  const newErrors: { [key: string]: string } = {};

  Object.entries(data).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      newErrors[key] = `${key} is required`;
    }
  });
  return newErrors;
}

export function getGoalHealth(goal: IGoal): "On Track" | "At Risk" | "High Risk" {
  const now = new Date();
  const start = new Date(goal.start_date);
  const end = new Date(goal.time_bound);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  if (goal.progress < expectedProgress - 20) {
    return "High Risk";
  }
  if (goal.progress < expectedProgress - 10) {
    return "At Risk";
  }
  return "On Track";
}

export function getActionPlanHealth(plan: IActionPlan): "On Track" | "At Risk" | "High Risk" {
  const now = new Date();
  const start = new Date(plan.start_date);
  const end = new Date(plan.end_date);

  // Hard signals first
  if (plan.status === 'Completed') return 'On Track';
  if (end.getTime() < now.getTime()) return 'High Risk';

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress =
    totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0;

  // Heuristic progress based on status (since action_plans has no numeric progress)
  const statusProgress =
    plan.status === 'In Progress' ? 50 : plan.status === 'Blocked' ? 20 : 0; // Not Started -> 0

  // Optional signal: stale weekly report (no update recently)
  const lastReportDate = (plan.weekly_reports || [])
    .map((r) => r.date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const daysSinceLastReport =
    lastReportDate ? Math.floor((now.getTime() - new Date(lastReportDate).getTime()) / (24 * 3600 * 1000)) : null;

  const stalePenalty = daysSinceLastReport != null && daysSinceLastReport > 14 && expectedProgress > 20 ? 10 : 0;
  const effectiveProgress = Math.max(0, statusProgress - stalePenalty);

  if (effectiveProgress < expectedProgress - 20) return 'High Risk';
  if (effectiveProgress < expectedProgress - 10) return 'At Risk';
  return 'On Track';
}

export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  // JS: 0=Sun ... 6=Sat. We want Monday=0.
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function endOfWeekMonday(d: Date): Date {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDateOnly(dateStr: string): Date {
  // dateStr: YYYY-MM-DD
  const [y, m, dd] = dateStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, dd || 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format ISO-ish timestamps to YYYY-MM-DD (date only).
// - If string already starts with YYYY-MM-DD, just return that.
// - Otherwise, try Date parsing and fall back to original string.
export function formatDateOnly(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m?.[1]) return m[1];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}