import type { LucideIcon } from "lucide-react";
import { InsightSpans } from "../../lib/insightText";
import { useSectionNav } from "../../state/SectionNavContext";
import { TONE_COLOR } from "../../lib/palette";
import type { Observation } from "../../lib/observations";

interface ObservationsPanelProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  observations: Observation[];
}

/** Auto-generated, filter-aware narrative cards -- the "Key Observations &
 * Leadership Notes" / "Category Observations" / "CPT Strategic Insights"
 * pattern from the reference mockup, computed live by lib/observations.ts
 * rather than hand-authored, so it never goes stale as filters change or the
 * source Excel is refreshed. The first (highest-priority) observation renders
 * as a lead tile so the single most important finding doesn't compete
 * visually with five others of equal weight. */
export function ObservationsPanel({ id, title, subtitle, icon: Icon, observations }: ObservationsPanelProps) {
  const [lead, ...rest] = observations;

  return (
    <section id={id} className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
      <div className="mb-5 flex items-start gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-700">
          <Icon size={21} strokeWidth={2.25} />
        </span>
        <div>
          <h3 className="text-sm font-medium text-brand-green-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-brand-green-700">{subtitle}</p>}
        </div>
      </div>

      {!lead ? (
        <p className="text-sm text-brand-green-700">Not enough data in the current view to generate observations.</p>
      ) : (
        <div className="space-y-3">
          <LeadTile observation={lead} />
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((o, i) => (
                <ObservationTile key={i} observation={o} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function LeadTile({ observation }: { observation: Observation }) {
  const { navigateToCard } = useSectionNav();
  const Icon = observation.icon;
  const color = TONE_COLOR[observation.tone];
  return (
    <div className="rounded-2xl border-l-[6px] p-5" style={{ background: `${color}12`, borderColor: `${color}30`, borderLeftColor: color, borderStyle: "solid", borderWidth: "1px 1px 1px 6px" }}>
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}24`, color }}>
          <Icon size={22} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color }}>
            Top Finding
          </span>
          <p className="mt-0.5 text-base font-semibold text-brand-green-900">{observation.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-green-900/80">
            <InsightSpans text={observation.body} />
          </p>
          {observation.cardId && (
            <button
              type="button"
              onClick={() => navigateToCard(observation.cardId!)}
              className="mt-2.5 text-xs font-medium text-brand-green-400 hover:underline"
            >
              View chart →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ObservationTile({ observation }: { observation: Observation }) {
  const { navigateToCard } = useSectionNav();
  const Icon = observation.icon;
  const color = TONE_COLOR[observation.tone];
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: `${color}0d`, borderColor: `${color}26`, borderLeftColor: color, borderStyle: "solid", borderWidth: "1px 1px 1px 3px" }}
    >
      <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${color}22`, color }}>
        <Icon size={13} strokeWidth={2.25} />
      </span>
      <p className="text-[12px] font-medium text-brand-green-900">{observation.title}</p>
      <p className="mt-1 text-[11px] leading-snug text-brand-green-900/70">
        <InsightSpans text={observation.body} />
      </p>
      {observation.cardId && (
        <button
          type="button"
          onClick={() => navigateToCard(observation.cardId!)}
          className="mt-1.5 text-[10.5px] font-medium text-brand-green-400 hover:underline"
        >
          View chart →
        </button>
      )}
    </div>
  );
}
