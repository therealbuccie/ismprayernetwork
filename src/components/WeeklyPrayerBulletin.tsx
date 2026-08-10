import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Music, Sparkles, ListChecks, ExternalLink } from "lucide-react";

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

  if (isLoading) return <Skeleton className="h-64 rounded-2xl mb-10" />;
  if (!week) return null;

  const points = (week.points || []).filter(p => p.focus || p.body);

  return (
    <section className="mb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold">{week.title}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Week of {new Date(week.week_start + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </motion.div>

      {week.intro && (
        <div className="glass-card rounded-2xl border border-border/50 p-5 mb-6 space-y-3 text-sm text-foreground/80 leading-relaxed">
          <Paragraphs text={week.intro} />
        </div>
      )}

      {/* 4 prayer point columns */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {points.map((p, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card rounded-2xl border border-border/50 p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center shrink-0">
                <Flame size={15} className="text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-accent font-semibold">{p.label || `Prayer Point ${i + 1}`}</p>
                {p.time && <p className="text-[11px] text-muted-foreground">{p.time}</p>}
              </div>
            </div>
            {p.focus && <h3 className="font-serif font-bold text-sm leading-snug mb-2">{p.focus}</h3>}
            {p.scripture && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-accent/50 pl-3 mb-3 leading-relaxed">{p.scripture}</p>
            )}
            {p.body && (
              <div className="text-sm text-foreground/80 leading-relaxed space-y-2">
                <Paragraphs text={p.body} />
              </div>
            )}
          </motion.article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {week.conclusion && (
          <div className="glass-card rounded-2xl border border-border/50 p-5">
            <h3 className="font-serif font-bold mb-3 flex items-center gap-2"><ListChecks size={17} className="text-accent" /> Conclusion</h3>
            <ol className="text-sm text-foreground/80 space-y-1.5 list-decimal list-inside">
              {week.conclusion.split(/\n+/).filter(Boolean).map((l, i) => (
                <li key={i}>{l.replace(/^\s*\d+[.)]\s*/, "")}</li>
              ))}
            </ol>
          </div>
        )}

        {(week.affirmations || week.confession_topic) && (
          <div className="glass-card rounded-2xl border border-border/50 p-5">
            <h3 className="font-serif font-bold mb-2 flex items-center gap-2">
              <Sparkles size={17} className="text-accent" /> Affirmation / Confession for the Week
            </h3>
            {week.confession_topic && (
              <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">{week.confession_topic}</p>
            )}
            {week.confession_scripture && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-accent/50 pl-3 mb-3 leading-relaxed">
                {week.confession_scripture}
              </p>
            )}
            {week.affirmations && (
              <div className="text-sm text-foreground/80 leading-relaxed space-y-2 max-h-80 overflow-y-auto pr-1">
                <Paragraphs text={week.affirmations} />
              </div>
            )}
          </div>
        )}

        {(week.song_title || week.song_lyrics) && (
          <div className="glass-card rounded-2xl border border-border/50 p-5 lg:col-span-2">
            <h3 className="font-serif font-bold mb-1 flex items-center gap-2"><Music size={17} className="text-accent" /> Song of the Week</h3>
            <p className="text-sm text-foreground/90 font-semibold">
              {week.song_title}{week.song_artist ? ` — ${week.song_artist}` : ""}
            </p>
            {week.song_url && (
              <a
                href={week.song_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1.5"
              >
                Watch / listen <ExternalLink size={12} />
              </a>
            )}
            {week.song_lyrics && (
              <div className="mt-4 text-sm text-foreground/75 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-1">
                {week.song_lyrics}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
