import Dropdown from '../Dropdown';
import { DateInput } from '../DateInput';
import { Input } from '../Input';
import { NumberInput } from '../NumberInput';
import { Textarea } from '../Textarea';
import type { GoalDraftState, GoalDurationType } from './useGoalDraft';

export function GoalCreateFormFields(props: {
  draft: GoalDraftState;
  onFieldChange: <K extends keyof GoalDraftState>(key: K, value: GoalDraftState[K]) => void;
  onStartDateChange: (val: string) => void;
  onDurationTypeChange: (val: GoalDurationType) => void;
}) {
  const { draft, onFieldChange, onStartDateChange, onDurationTypeChange } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cột trái: SMART */}
      <div className="space-y-4">
        <Input label="Goal Title" value={draft.name} onChange={(v) => onFieldChange('name', v)} />
        <Input label="Skill" value={draft.skill} onChange={(v) => onFieldChange('skill', v)} />
        <div className="flex gap-2">
          <Dropdown
            label="Goal type"
            value={draft.type}
            options={['Soft', 'Hard']}
            onChange={(v) => onFieldChange('type', v as GoalDraftState['type'])}
          />
          <Dropdown
            label="Goal Duration"
            value={draft.durationType}
            options={['Quarter', 'HalfYear']}
            onChange={(v) => onDurationTypeChange(v as GoalDurationType)}
          />
        </div>
        <Input label="Specific" value={draft.specific} onChange={(v) => onFieldChange('specific', v)} />
        <Input label="Measurable" value={draft.measurable} onChange={(v) => onFieldChange('measurable', v)} />
        <Input label="Achievable" value={draft.achievable} onChange={(v) => onFieldChange('achievable', v)} />
        <Input label="Relevant" value={draft.relevant} onChange={(v) => onFieldChange('relevant', v)} />
      </div>

      {/* Cột phải: thời gian & tiến độ */}
      <div className="space-y-4">
        <DateInput label="Start Date" value={draft.start_date} onChange={onStartDateChange} />
        <DateInput
          label="Deadline"
          disabled={true}
          value={draft.time_bound}
          onChange={(v) => onFieldChange('time_bound', v)}
        />
        <Input
          label="Success Metric"
          value={draft.success_metric}
          onChange={(v) => onFieldChange('success_metric', v)}
        />
        <Dropdown
          label="Status"
          value={draft.status}
          options={['Draft', 'In Progress', 'Completed', 'Cancelled', 'Not started']}
          onChange={(v) => onFieldChange('status', v as GoalDraftState['status'])}
        />
        <NumberInput
          label="Progress (%)"
          value={draft.progress}
          onChange={(v) => onFieldChange('progress', v)}
        />
        <NumberInput label="Weight (%)" value={draft.weight} onChange={(v) => onFieldChange('weight', v)} />
        <Input label="Risk" value={draft.risk} onChange={(v) => onFieldChange('risk', v)} />
        <Input
          label="Dependencies"
          value={draft.dependencies}
          onChange={(v) => onFieldChange('dependencies', v)}
        />
        <Textarea label="Notes" value={draft.notes} onChange={(v) => onFieldChange('notes', v)} />
      </div>
    </div>
  );
}


