import { cn } from "@/lib/utils";
import { chapterNumber, chapterTitles, type ChapterId } from "@/lib/chapters";

/** Story chapter eyebrow, e.g. "02 — Signals". Numbered from lib/chapters. */
export function ChapterLabel({ id, className }: { id: ChapterId; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/50",
        className,
      )}
    >
      <span className="font-mono tracking-[0.2em] text-white/80">{chapterNumber(id)}</span>
      <span aria-hidden className="h-px w-6 bg-white/30" />
      {chapterTitles[id]}
    </p>
  );
}
