import { useState } from 'react';
import Modal from '../../common/Modal';
import type { IActionPlan } from '../../types';
import Dropdown from '../Dropdown';
import { Button } from '../Button';

type ReviewStatus = 'Approved' | 'Rejected' | 'Pending';

interface ReviewPayload {
  status: ReviewStatus;
  comment: string;
}

interface ReviewActionPlanModalProps {
  plan: IActionPlan;
  onClose: () => void;
  onSubmit: (payload: ReviewPayload) => void;
}

export default function ReviewActionPlanModal({
  plan,
  onClose,
  onSubmit,
}: ReviewActionPlanModalProps) {
  const [status, setStatus] = useState<ReviewStatus>('Approved');
  const [comment, setComment] = useState('');

  return (
    <Modal isOpen={true} title="Review Action Plan" onClose={onClose}>
      <p>
        <strong className='font-medium'>Activity:</strong> {plan.activity}
      </p>
      <p>
        <strong className='font-medium'>Duration:</strong> {plan.start_date} → {plan.end_date}
      </p>
      {plan.request_deadline_date && (
        <div className="border rounded p-3 bg-gray-50 mt-2 font-medium">
          <p>
            <strong className='font-medium'>Deadline change requested:</strong> {plan.request_deadline_date}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Changes used: {plan.deadline_change_count || 0}/3
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Approve sẽ apply deadline mới. Reject sẽ bỏ request.
          </p>
        </div>
      )}

      <Dropdown
        label="Action Plan Review Status"
        value={status}
        options={['Approved', 'Rejected', 'Pending']}
        onChange={(v) => setStatus(v as ReviewStatus)}
      />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded p-2 mt-3"
        placeholder="Leader review note"
      />

      <Button
        onClick={() => onSubmit({ status, comment })}
        variant="success"
        className="mt-4"
      >
        Save
      </Button>
    </Modal>
  );
}


