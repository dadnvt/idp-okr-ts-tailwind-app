import { FaChevronDown } from 'react-icons/fa';

interface DropdownProps<T extends string | number> {
  label: string;
  value: T;
  options: T[];
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
            <option key={opt} value={opt}>
              {opt}
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
