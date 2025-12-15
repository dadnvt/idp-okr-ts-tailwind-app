import { useState } from "react";
import Modal from "../../common/Modal";
import type { IGoal } from "../../types";
import Dropdown from "../Dropdown";

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
    <Modal isOpen={true} title="Đánh giá Goal" onClose={onClose}>
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
      <button
        onClick={() => onSubmit({ status, comment })}
        className="w-full bg-green-600 text-white py-2 rounded mt-4"
      >
        Lưu đánh giá
      </button>
    </Modal>
  );
}
