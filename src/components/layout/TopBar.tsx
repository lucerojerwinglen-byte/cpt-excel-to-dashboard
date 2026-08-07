import { DASHBOARD_DATA } from "../../data/loadData";
import { fmtDateShort } from "../../lib/format";
import sagilityLogo from "../../assets/sagility-logo-white.png";

export function TopBar() {
  const { meta } = DASHBOARD_DATA;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-2">
        <img src={sagilityLogo} alt="Sagility" className="h-[52px] w-auto" />
      </div>
      <div className="text-right">
        <h1 className="text-2xl font-medium text-brand-green-50">CPT Performance Dashboard</h1>
        <p className="mt-1 text-sm text-brand-green-200">
          Philippines & India · Workday case processing · {fmtDateShort(meta.dateRange.min)} –{" "}
          {fmtDateShort(meta.dateRange.max)} · All times in Philippine Standard Time (UTC+8)
        </p>
        <a href="#about-data" className="mt-1 inline-block text-xs text-brand-green-200/80 underline-offset-2 hover:underline">
          About this data ↓
        </a>
      </div>
    </header>
  );
}
