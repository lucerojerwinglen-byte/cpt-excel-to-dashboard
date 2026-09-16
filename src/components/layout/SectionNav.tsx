import { useEffect, useRef, useState } from "react";
import { SECTIONS_META, useSectionNav } from "../../state/SectionNavContext";

/** Top page-switcher tab bar. Each page's charts mount only while active (see
 * App.tsx), so which tab is *active* is a plain controlled selector, not a
 * scroll-spy -- there's no shared scroll position driving that anymore. The
 * bar does still watch scroll position for one unrelated reason: it's sticky,
 * and goes translucent once stuck so it doesn't fully block the chart content
 * scrolling underneath it. Tabs wrap onto as many rows as needed at their
 * natural width, rather than scrolling horizontally -- with 10 sections, a
 * single scrollable row hid most tabs behind a scrollbar; every tab is now
 * visible at once. */
export function SectionNav() {
  const { activeSection, setActiveSection } = useSectionNav();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  /* Zero-height marker sitting where the bar's un-stuck top edge is. Once it
   * scrolls out of the viewport, the bar itself has detached into its sticky,
   * floating position -- more reliable than a fixed scroll-distance guess
   * since the header above (filters, active-filter chips) varies in height. */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // A Fragment, not a wrapping <div>: a sticky element can only ever
    // detach and float within the bounds of its containing block (its
    // parent). A wrapper sized to fit just the sentinel + nav would be no
    // taller than the nav itself, leaving no "runway" for it to stick within
    // -- it would scroll away with that wrapper instead of ever appearing
    // stuck. Rendering both as direct children of <main> (which spans the
    // whole scrollable page) gives it that runway.
    <>
      <div ref={sentinelRef} style={{ marginBottom: 0 }} />
      <nav
        className={`sticky top-3 z-30 rounded-full p-1.5 shadow-[0_1px_2px_rgba(0,33,26,0.06)] transition-[background-color,backdrop-filter] duration-300 ${
          stuck ? "bg-white/75 backdrop-blur-md" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap gap-1">
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
        </div>
      </nav>
    </>
  );
}
