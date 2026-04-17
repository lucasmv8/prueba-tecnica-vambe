interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  activeColor?: string;
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  activeColor = "#2563EB",
}: ToggleGroupProps<T>) {
  return (
    <div className="flex items-center bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            value === opt.value
              ? "text-white font-medium"
              : "text-[#606060] hover:text-[#A0A0A0]"
          }`}
          style={value === opt.value ? { backgroundColor: activeColor } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
