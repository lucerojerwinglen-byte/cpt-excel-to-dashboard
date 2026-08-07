interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  return (
    <div className="flex rounded-full bg-brand-green-50 p-1 text-xs font-medium">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            value === o.value
              ? "rounded-full bg-brand-green-700 px-3 py-1 text-white transition-colors"
              : "rounded-full px-3 py-1 text-brand-green-700 transition-colors hover:text-brand-green-900"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
