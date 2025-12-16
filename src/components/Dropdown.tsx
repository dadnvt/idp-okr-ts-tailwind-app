import { FaChevronDown } from 'react-icons/fa';

type DropdownOption<T extends string | number> = T | { id: T; label: string };

interface DropdownProps<T extends string | number> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function Dropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: DropdownProps<T>) {
  const getId = (opt: DropdownOption<T>): T => (typeof opt === 'object' ? opt.id : opt);
  const getLabel = (opt: DropdownOption<T>): string => (typeof opt === 'object' ? opt.label : String(opt));

  return (
    <div className="relative inline-block w-40">
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
          className="appearance-none w-full px-4 py-2 pr-8 border rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={String(getId(opt))} value={getId(opt)}>
              {getLabel(opt)}
            </option>
          ))}
        </select>

        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          <FaChevronDown size={14} />
        </span>
      </div>
    </div>
  );
}
