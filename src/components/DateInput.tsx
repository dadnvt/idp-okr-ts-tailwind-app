interface DateInputProps {
  label: string;
  value: string;
  disabled? : boolean;
  onChange: (val: string) => void;
}

export function DateInput({ label, value, disabled, onChange }: DateInputProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type="date"
        value={value}
        disabled = {disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );
}
