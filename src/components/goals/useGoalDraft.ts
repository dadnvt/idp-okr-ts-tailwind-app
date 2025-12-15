import { useCallback, useMemo, useState } from 'react';
import { getHalfYearRollingEnd, getQuarter, getQuarterEnd } from '../../common/Utility';

export type GoalDurationType = 'Quarter' | 'HalfYear';

export interface GoalDraftState {
  name: string;
  skill: string;
  time_bound: string;
  type: 'Soft' | 'Hard';
  durationType: GoalDurationType;
  progress: number;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  start_date: string;
  success_metric: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Cancelled' | 'Not started';
  weight: number;
  risk: string;
  dependencies: string;
  notes: string;
}

const DEFAULT_DRAFT: GoalDraftState = {
  name: '',
  skill: '',
  time_bound: '',
  type: 'Soft',
  durationType: 'Quarter',
  progress: 0,
  specific: '',
  measurable: '',
  achievable: '',
  relevant: '',
  start_date: '',
  success_metric: '',
  status: 'Not started',
  weight: 0,
  risk: '',
  dependencies: '',
  notes: '',
};

function computeDeadline(startDate: string, durationType: GoalDurationType): string {
  if (!startDate) return '';
  const start = new Date(startDate);

  if (durationType === 'Quarter') {
    const quarter = getQuarter(start.getMonth() + 1);
    const quarterEnd = getQuarterEnd(start.getFullYear(), quarter);
    return quarterEnd.toISOString().split('T')[0];
  }

  const halfYearEnd = getHalfYearRollingEnd(start);
  return halfYearEnd.toISOString().split('T')[0];
}

export function useGoalDraft(initial?: Partial<GoalDraftState>) {
  const [draft, setDraft] = useState<GoalDraftState>({ ...DEFAULT_DRAFT, ...(initial || {}) });

  const setField = useCallback(
    <K extends keyof GoalDraftState>(key: K, value: GoalDraftState[K]) => {
      setDraft(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const onStartDateChange = useCallback((val: string) => {
    setDraft(prev => {
      const time_bound = computeDeadline(val, prev.durationType);
      return { ...prev, start_date: val, time_bound };
    });
  }, []);

  const onDurationTypeChange = useCallback((val: GoalDurationType) => {
    setDraft(prev => {
      if (!prev.start_date) return { ...prev, durationType: val };
      const time_bound = computeDeadline(prev.start_date, val);
      return { ...prev, durationType: val, time_bound };
    });
  }, []);

  const reset = useCallback(() => setDraft({ ...DEFAULT_DRAFT, ...(initial || {}) }), [initial]);

  return useMemo(
    () => ({
      draft,
      setDraft,
      setField,
      reset,
      onStartDateChange,
      onDurationTypeChange,
    }),
    [draft, onDurationTypeChange, onStartDateChange, reset, setField]
  );
}


