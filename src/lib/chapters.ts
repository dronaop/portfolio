/**
 * The page's story chapters, in scroll order. Chapter numbers in labels
 * ("02 — Signals") come from this order, so adding a chapter renumbers
 * everything after it.
 */
export const chapters = ["data", "signals", "production", "journey", "contact"] as const;

export type ChapterId = (typeof chapters)[number];

export const chapterTitles: Record<ChapterId, string> = {
  data: "Data",
  signals: "Signals",
  production: "Production",
  journey: "Journey",
  contact: "Contact",
};

export function chapterNumber(id: ChapterId) {
  return String(chapters.indexOf(id) + 1).padStart(2, "0");
}
