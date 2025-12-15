import { useState } from 'react';
import Modal from '../common/Modal';
import type { IActionPlan, IWeeklyReport } from '../types';
import { DateInput } from './DateInput';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';

export default function WeeklyReportCreateModal(props: {
  plan: IActionPlan;
  onClose: () => void;
  onSubmit: (payload: Omit<IWeeklyReport, 'id'>) => Promise<void> | void;
}) {
  const { plan, onClose, onSubmit } = props;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) return setError('Date is required');
    if (!summary.trim()) return setError('Summary is required');

    await onSubmit({
      goal_id: plan.goal_id,
      action_plan_id: plan.id,
      date,
      summary: summary.trim(),
      work_done: workDone.trim(),
      blockers_challenges: blockers.trim(),
      next_week_plan: nextWeekPlan.trim(),
      lead_feedback: '',
    });
  }

  return (
    <Modal isOpen={true} title="Add Weekly Report" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">
          <strong>Action Plan:</strong> {plan.activity}
        </p>

        <DateInput label="Date *" value={date} onChange={setDate} />
        <Input label="Summary *" value={summary} onChange={setSummary} placeholder="Short summary" />
        <Textarea label="Work done (optional)" value={workDone} onChange={setWorkDone} />
        <Textarea label="Blockers (optional)" value={blockers} onChange={setBlockers} />
        <Textarea label="Next week plan (optional)" value={nextWeekPlan} onChange={setNextWeekPlan} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}


