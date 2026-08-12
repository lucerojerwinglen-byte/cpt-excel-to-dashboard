import { useEffect, useRef, useState } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  searchable?: boolean;
}

export function MultiSelect({ label, options, selected, onToggle, searchable = false }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const visibleOptions = searchable && query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const buttonLabel = selected.size === 0
    ? `All ${label}`
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} ${label} selected`;

  return (
    <div ref={rootRef} className="relative min-w-[180px]">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-brand-green-700">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-brand-green-700/15 bg-white px-3 py-2 text-left text-sm text-brand-green-900 transition-colors hover:border-brand-green-700/30"
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="text-brand-green-700">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full min-w-[220px] rounded-xl border border-brand-green-700/10 bg-white p-2 shadow-lg">
          {searchable && (
            <input
              autoFocus
              type="text"
              placeholder={`Search ${label.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2 w-full rounded-lg border border-brand-green-700/15 px-2 py-1.5 text-sm text-brand-green-900 outline-none placeholder:text-brand-green-700/60 focus:border-brand-green-400"
            />
          )}
          <div className="max-h-64 overflow-y-auto">
            {visibleOptions.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-brand-green-700">No matches</p>
            )}
            {visibleOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-brand-green-900 hover:bg-brand-green-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option)}
                  onChange={() => onToggle(option)}
                  className="accent-brand-green-400"
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
