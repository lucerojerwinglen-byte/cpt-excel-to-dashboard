import { SECTIONS_META, useSectionNav } from "../../state/SectionNavContext";

/** Top page-switcher tab bar. Each page's charts mount only while active (see
 * App.tsx), so this is a plain controlled selector, not a scroll-spy -- there's
 * no shared scroll position for it to track anymore. Horizontally scrollable
 * (not equal-width / not wrapping) so 5 tabs at their natural width never
 * crush or wrap on narrower screens. */
export function SectionNav() {
  const { activeSection, setActiveSection } = useSectionNav();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
      {SECTIONS_META.map((s) => {
        const Icon = s.icon;
        const active = activeSection === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand-green-700 text-white" : "text-brand-green-700 hover:bg-brand-green-50"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
