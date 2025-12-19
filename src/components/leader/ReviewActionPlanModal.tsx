import { useMemo, useState } from 'react';
import Modal from '../../common/Modal';
import type { IActionPlan } from '../../types';
import Dropdown from '../Dropdown';
import { Button } from '../Button';
import { formatDateOnly } from '../../common/Utility';

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
  const initialStatus = ((): ReviewStatus => {
    const s = plan.review_status;
    return s === 'Approved' || s === 'Rejected' || s === 'Pending' ? s : 'Approved';
  })();

  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [comment, setComment] = useState(plan.leader_review_notes || '');

  const reviewedBy = useMemo(() => {
    return plan.reviewed_by_name || plan.reviewed_by_email || plan.reviewed_by || null;
  }, [plan.reviewed_by, plan.reviewed_by_email, plan.reviewed_by_name]);

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

      {(plan.reviewed_at || plan.approved_at || plan.rejected_at || reviewedBy) && (
        <div className="border rounded p-3 bg-gray-50 mt-3 text-sm space-y-1">
          <p>
            <strong>Last reviewed by:</strong> {reviewedBy || '-'}
          </p>
          <p>
            <strong>Reviewed at:</strong> {formatDateOnly(plan.reviewed_at) || '-'}
          </p>
          <p>
            <strong>Approved at:</strong> {formatDateOnly(plan.approved_at) || '-'}
          </p>
          <p>
            <strong>Rejected at:</strong> {formatDateOnly(plan.rejected_at) || '-'}
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


