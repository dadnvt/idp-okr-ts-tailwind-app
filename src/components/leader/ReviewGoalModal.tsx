import { useState } from "react";
import Modal from "../../common/Modal";
import type { IGoal } from "../../types";
import Dropdown from "../Dropdown";
import { Button } from "../Button";

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
  const [status, setStatus] = useState<ReviewStatus>('Approved');
  const [comment, setComment] = useState('');

  return (
    <Modal isOpen={true} title="Review Goal" onClose={onClose}>
      <p>
        <strong>Member:</strong> {goal.user_email}
      </p>
      <p>
        <strong>Goal:</strong> {goal.name}
      </p>

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
        fullWidth
        className="mt-4"
      >
        Save
      </Button>
    </Modal>
  );
}
