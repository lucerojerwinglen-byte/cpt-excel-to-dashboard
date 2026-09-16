import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TopPerformerEntry } from "../data/topPerformer";

type MonthEntries = Record<string, TopPerformerEntry>;
type AllEntries = Record<string, MonthEntries>;

/** Bump if the persisted shape ever changes incompatibly, so a stale
 * localStorage blob from an older version doesn't get misread. */
const STORAGE_KEY = "cpt-top-performer-entries-v1";

const EMPTY_ENTRY: TopPerformerEntry = { quality: null, leaves: false };

function loadFromStorage(): AllEntries {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AllEntries) : {};
  } catch {
    return {};
  }
}

interface TopPerformerStoreValue {
  getEntry: (monthKey: string, name: string) => TopPerformerEntry;
  setQuality: (monthKey: string, name: string, quality: number) => void;
  setLeaves: (monthKey: string, name: string, leaves: boolean) => void;
}

const TopPerformerStoreContext = createContext<TopPerformerStoreValue | null>(null);

/** Manual Quality/Leaves entries this app has no backend for -- persisted to
 * the leader's own browser via localStorage (best-effort, silently a no-op
 * in private browsing or over quota). Mounted once near the app root so
 * entries survive switching nav tabs, not just while the Top Performer tab
 * itself is mounted. */
export function TopPerformerStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AllEntries>(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Unavailable -- entries just won't survive a reload; Export is the fallback.
    }
  }, [data]);

  const value = useMemo<TopPerformerStoreValue>(
    () => ({
      getEntry: (monthKey, name) => data[monthKey]?.[name] ?? EMPTY_ENTRY,
      setQuality: (monthKey, name, quality) =>
        setData((prev) => ({
          ...prev,
          [monthKey]: { ...prev[monthKey], [name]: { ...(prev[monthKey]?.[name] ?? EMPTY_ENTRY), quality } },
        })),
      setLeaves: (monthKey, name, leaves) =>
        setData((prev) => ({
          ...prev,
          [monthKey]: { ...prev[monthKey], [name]: { ...(prev[monthKey]?.[name] ?? EMPTY_ENTRY), leaves } },
        })),
    }),
    [data],
  );

  return <TopPerformerStoreContext.Provider value={value}>{children}</TopPerformerStoreContext.Provider>;
}

export function useTopPerformerStore(): TopPerformerStoreValue {
  const ctx = useContext(TopPerformerStoreContext);
  if (!ctx) throw new Error("useTopPerformerStore must be used within a TopPerformerStoreProvider");
  return ctx;
}
