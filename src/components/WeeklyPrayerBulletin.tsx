import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music, Sparkles, ListChecks, ExternalLink, ChevronRight, BookOpen, HandHeart } from "lucide-react";
import { useState } from "react";

interface WeekPoint {
  label: string;
  time: string;
  focus: string;
  scripture: string;
  body: string;
}

interface PrayerWeek {
  id: string;
  week_start: string;
  title: string;
  intro: string | null;
  points: WeekPoint[];
  conclusion: string | null;
  confession_topic: string | null;
  confession_scripture: string | null;
  affirmations: string | null;
  song_title: string | null;
  song_artist: string | null;
  song_url: string | null;
  song_lyrics: string | null;
}

const Paragraphs = ({ text, className = "" }: { text: string; className?: string }) => (
  <>
    {text.split(/\n+/).filter(Boolean).map((line, i) => (
      <p key={i} className={className}>{line}</p>
    ))}
  </>
);

/** Pull just the reference (e.g. "1 Timothy 2:1–2") out of a full scripture text. */
const scriptureRef = (s: string) => {
  const m = s.match(
    /((?:\d[\s.])?[A-Za-z\u00C0-\u024F .']+?)\s+\d+(?:\s*[-–—]\s*\d+)?(?::\d+(?:\s*[-–—]\s*\d+)?)?(\s*\((?:KJV|NKJV|NIV|NLT|AMP|ESV|MSG|CEV)\))?/
  );
  if (m) return m[0].trim().replace(/[:;,.]+$/, "");
  return s.split(/[—–-]/)[0].trim().slice(0, 60);
};

/** First meaningful line for the card preview (skips stray numbering lines). */
const previewLine = (s: string) => {
  const lines = s.split(/\n+/).map(l => l.trim()).filter(Boolean);
  return lines.find(l => l.length > 12) || lines[0] || "";
};

export function WeeklyPrayerBulletin() {
  const { data: week, isLoading } = useQuery({
    queryKey: ["prayer-week-current"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_weeks")
        .select("*")
        .eq("is_active", true)
        .eq("archived", false)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? ({ ...(data as any), points: ((data as any).points || []) as WeekPoint[] } as PrayerWeek) : null;
    },
  });

  const [active, setActive] = useState<WeekPoint | null>(null);
  const activeIndex = week ? (week.points || []).findIndex(p => p === active) : -1;

  if (isLoading) return <Skeleton className="h-64 rounded-2xl mb-10" />;
  if (!week) return null;

  const points = (week.points || []).filter(p => p.focus || p.body);

  return (
    <section className="mb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
          <span className="text-accent font-semibold">This Week</span>
          <span className="mx-2">•</span>
          {(() => {
            const s0 = new Date(week.week_start + "T00:00:00");
            const e0 = new Date(s0); e0.setDate(s0.getDate() + 6);
            const f = (d: Date, y = false) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(y ? { year: "numeric" } : {}) });
            return `${f(s0)} — ${f(e0, true)}`;
          })()}
        </p>
        <h2 className="text-sm md:text-base font-serif text-foreground/80 mt-1.5 max-w-2xl mx-auto">{week.title}</h2>
      </motion.div>

      {week.intro && (
        <div className="glass-card rounded-xl border border-border/40 p-4 mb-5 space-y-2 text-sm text-foreground/80 leading-relaxed">
          <Paragraphs text={week.intro} />
        </div>
      )}

      {/* Prayer point cards — one shared navy/gold design */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {points.map((p, i) => (
          <motion.button
            type="button"
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActive(p)}
            className="prayer-card p-5 text-left flex flex-col gap-2 min-h-[260px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.time && <span className="text-xs text-foreground/70 truncate">{p.time}</span>}
            </div>
            <h3 className="font-serif font-bold text-xl leading-tight text-foreground pr-6 mt-1">
              {p.focus || p.label || `Prayer Point ${i + 1}`}
            </h3>
            {p.scripture && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
                <BookOpen size={14} className="shrink-0" /> <span className="truncate">{scriptureRef(p.scripture)}</span>
              </p>
            )}
            {p.body && (
              <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3 pr-8">
                {previewLine(p.body)}
              </p>
            )}
            <span className="mt-auto pt-3">
              <span className="flex items-center justify-between rounded-xl border border-accent/60 bg-background/40 px-4 py-2.5 text-sm font-semibold text-accent backdrop-blur-sm">
                <span className="inline-flex items-center gap-2"><HandHeart size={16} /> View &amp; Pray</span>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-accent/60"><ChevronRight size={14} /></span>
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {week.conclusion && (
          <div className="glass-card rounded-xl border border-border/40 p-4">
            <h3 className="font-serif font-bold mb-2 flex items-center gap-2 text-sm"><ListChecks size={16} className="text-accent" /> Conclusion</h3>
            <ol className="text-sm text-foreground/80 space-y-1 list-decimal list-inside">
              {week.conclusion.split(/\n+/).filter(Boolean).map((l, i) => (
                <li key={i}>{l.replace(/^\s*\d+[.)]\s*/, "")}</li>
              ))}
            </ol>
          </div>
        )}

        {(week.affirmations || week.confession_topic) && (
          <div className="glass-card rounded-xl border border-border/40 p-4">
            <h3 className="font-serif font-bold mb-2 flex items-center gap-2 text-sm">
              <Sparkles size={16} className="text-accent" /> Affirmation / Confession for the Week
            </h3>
            {week.confession_topic && (
              <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">{week.confession_topic}</p>
            )}
            {week.confession_scripture && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-accent/50 pl-3 mb-2 leading-relaxed">
                {week.confession_scripture}
              </p>
            )}
            {week.affirmations && (
              <div className="text-sm text-foreground/80 leading-relaxed space-y-2 max-h-72 overflow-y-auto pr-1">
                <Paragraphs text={week.affirmations} />
              </div>
            )}
          </div>
        )}

        {(week.song_title || week.song_lyrics) && (
          <div className="glass-card rounded-xl border border-border/40 p-4 lg:col-span-2">
            <h3 className="font-serif font-bold mb-1 flex items-center gap-2 text-sm"><Music size={16} className="text-accent" /> Song of the Week</h3>
            <p className="text-sm text-foreground/90 font-semibold">
              {week.song_title}{week.song_artist ? ` — ${week.song_artist}` : ""}
            </p>
            {week.song_url && (
              <a
                href={week.song_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
              >
                Watch / listen <ExternalLink size={12} />
              </a>
            )}
            {week.song_lyrics && (
              <div className="mt-3 text-sm text-foreground/75 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto pr-1">
                {week.song_lyrics}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full prayer point modal */}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader className="text-left">
                <p className="text-[11px] uppercase tracking-wider text-accent font-semibold">
                  Prayer Point {activeIndex + 1}{active.time ? ` • ${active.time}` : ""}
                </p>
                <DialogTitle className="font-serif text-lg leading-snug">{active.focus || active.label}</DialogTitle>
              </DialogHeader>
              {active.scripture && (
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1.5">Scripture</p>
                  <p className="text-sm italic text-foreground/80 leading-relaxed whitespace-pre-line">{active.scripture}</p>
                </div>
              )}
              {active.body && (
                <div className="text-sm text-foreground/85 leading-relaxed space-y-3">
                  <Paragraphs text={active.body} />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
