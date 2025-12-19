import { useMemo, useState } from "react";
import Modal from "../../common/Modal";
import type { IGoal } from "../../types";
import Dropdown from "../Dropdown";
import { Button } from "../Button";
import { formatDateOnly } from "../../common/Utility";

type ReviewStatus = 'Approved' | 'Rejected' | 'Pending';

interface ReviewPayload {
  status: ReviewStatus;
  comment: string;
}

interface ReviewGoalModalProps {
  goal: IGoal;
  onClose: () => void;
  onSubmit: (payload: ReviewPayload) => void;
}

export default function ReviewGoalModal({
  goal,
  onClose,
  onSubmit,
}: ReviewGoalModalProps) {
  const initialStatus = ((): ReviewStatus => {
    const s = goal.review_status;
    return s === 'Approved' || s === 'Rejected' || s === 'Pending' ? s : 'Approved';
  })();

  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [comment, setComment] = useState(goal.leader_review_notes || '');

  const reviewedBy = useMemo(() => {
    return goal.reviewed_by_name || goal.reviewed_by_email || goal.reviewed_by || null;
  }, [goal.reviewed_by, goal.reviewed_by_email, goal.reviewed_by_name]);

  return (
    <Modal isOpen={true} title="Review Goal" onClose={onClose}>
      <p>
        <strong>Member:</strong> {goal.user_email}
      </p>
      <p>
        <strong>Goal:</strong> {goal.name}
      </p>

      {(goal.reviewed_at || goal.approved_at || goal.rejected_at || reviewedBy) && (
        <div className="border rounded p-3 bg-gray-50 mt-3 text-sm space-y-1">
          <p>
            <strong>Last reviewed by:</strong> {reviewedBy || '-'}
          </p>
          <p>
            <strong>Reviewed at:</strong> {formatDateOnly(goal.reviewed_at) || '-'}
          </p>
          <p>
            <strong>Approved at:</strong> {formatDateOnly(goal.approved_at) || '-'}
          </p>
          <p>
            <strong>Rejected at:</strong> {formatDateOnly(goal.rejected_at) || '-'}
          </p>
        </div>
      )}

      {/* Status */}
      <Dropdown
        label="Goal Status"
        value={status}
        options={['Approved', 'Rejected', 'Pending']}
        onChange={(v) => setStatus(v as ReviewStatus)}
      />

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded p-2 mt-3"
        placeholder="Leader review note"
      />

      {/* Submit */}
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
