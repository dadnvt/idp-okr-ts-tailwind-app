import { useState } from 'react';
import Dropdown from './Dropdown';
import { useAuth } from '../common/AuthContext';
import { Input } from './Input';

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
  const [resourse, setResourse] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [expectedOutcome, setExpectedOutcome] = useState('');

  const { auth } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      goal_id: goalId,
      activity,
      start_date: startDate,
      end_date: endDate,
      expected_outcome: expectedOutcome,
      status: status,
      owner : auth.user?.email,
      evidence_link : evidenceLink,
      resourse: resourse
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Activity" value={activity} onChange={setActivity} />

      <input
        type="date"
        className="w-full border p-2 rounded"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        required
      />

      <input
        type="date"
        className="w-full border p-2 rounded"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        required
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

      <textarea
        className="w-full border p-2 rounded"
        placeholder="Expected outcome"
        value={expectedOutcome}
        onChange={e => setExpectedOutcome(e.target.value)}
        required
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-brand text-white rounded"
        >
          Save
        </button>
      </div>
    </form>
  );
}