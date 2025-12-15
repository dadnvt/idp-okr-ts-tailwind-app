import { useMemo, useState } from 'react';
import Dropdown from './Dropdown';
import { useAuth } from '../common/AuthContext';
import { Input } from './Input';
import { DateInput } from './DateInput';
import { Textarea } from './Textarea';
import { Button } from './Button';

export function CreateActionPlanForm({
  goalId,
  onSubmit,
  onCancel,
}: {
  goalId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [activity, setActivity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [resources, setResourse] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [owner, setOwner] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { auth } = useAuth();

  const effectiveOwner = useMemo(() => {
    return owner.trim() || auth.user?.name || auth.user?.email || '';
  }, [owner, auth.user?.name, auth.user?.email]);

  function validate() {
    const next: Record<string, string> = {};

    if (!activity.trim()) next.activity = 'Activity is required';
    if (!startDate) next.start_date = 'Start date is required';
    if (!endDate) next.end_date = 'End date is required';

    if (startDate && endDate && endDate < startDate) {
      next.end_date = 'End date must be on or after start date';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      goal_id: goalId,
      activity: activity.trim(),
      start_date: startDate,
      end_date: endDate,
      expected_outcome: expectedOutcome.trim(),
      status: status,
      owner: effectiveOwner,
      evidence_link: evidenceLink.trim(),
      resources: resources.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <Input label="Activity *" value={activity} onChange={setActivity} />
        {errors.activity && <p className="text-sm text-red-600">{errors.activity}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <DateInput label="Start date *" value={startDate} onChange={setStartDate} />
          {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
        </div>
        <div className="space-y-1">
          <DateInput label="End date *" value={endDate} onChange={setEndDate} />
          {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
        </div>
      </div>

      <Input
        label="Owner (optional)"
        value={owner}
        onChange={setOwner}
        placeholder={auth.user?.name || auth.user?.email || ''}
      />

      <Dropdown
        label="Status"
        value={status}
        options={[
          'Not Started',
          'In Progress',
          'Completed',
          'Blocked',
        ]}
        onChange={(val) => setStatus(val)}
      />

      <Textarea
        label="Expected outcome (optional)"
        value={expectedOutcome}
        onChange={setExpectedOutcome}
        placeholder="Expected outcome"
      />

      <Textarea
        label="Resources (optional)"
        value={resources}
        onChange={setResourse}
        placeholder="Resources"
      />

      <Input
        label="Evidence link (optional)"
        value={evidenceLink}
        onChange={setEvidenceLink}
        placeholder="https://..."
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
}