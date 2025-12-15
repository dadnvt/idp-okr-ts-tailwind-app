import type { IGoal } from "../types";

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