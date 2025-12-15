interface TextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function Textarea({ label, value, onChange, placeholder }: TextareaProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
        rows={3}
      />
    </div>
  );
}
