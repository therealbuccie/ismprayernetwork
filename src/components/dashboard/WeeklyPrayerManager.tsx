import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarRange, Plus, Pencil, Trash2, Archive, ArchiveRestore, Music, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface WeekPoint {
  label: string;
  time: string;
  focus: string;
  scripture: string;
  body: string;
}

export interface PrayerWeek {
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
  is_active: boolean;
  archived: boolean;
}

const emptyPoint = (i: number): WeekPoint => ({
  label: `Prayer Point ${i}`,
  time: "",
  focus: "",
  scripture: "",
  body: "",
});

const emptyForm = {
  week_start: new Date().toISOString().slice(0, 10),
  title: "",
  intro: "",
  points: [1, 2, 3, 4].map(emptyPoint),
  conclusion: "",
  confession_topic: "",
  confession_scripture: "",
  affirmations: "",
  song_title: "",
  song_artist: "",
  song_url: "",
  song_lyrics: "",
  is_active: true,
};

export function WeeklyPrayerManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrayerWeek | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showArchive, setShowArchive] = useState(false);

  const { data: weeks = [], isLoading } = useQuery({
    queryKey: ["prayer-weeks-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_weeks")
        .select("*")
        .order("week_start", { ascending: false });
      if (error) throw error;
      return (data as any[]).map(w => ({ ...w, points: (w.points || []) as WeekPoint[] })) as PrayerWeek[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["prayer-weeks-admin"] });
    queryClient.invalidateQueries({ queryKey: ["prayer-week-current"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        week_start: values.week_start,
        title: values.title,
        intro: values.intro || null,
        points: values.points as any,
        conclusion: values.conclusion || null,
        confession_topic: values.confession_topic || null,
        confession_scripture: values.confession_scripture || null,
        affirmations: values.affirmations || null,
        song_title: values.song_title || null,
        song_artist: values.song_artist || null,
        song_url: values.song_url || null,
        song_lyrics: values.song_lyrics || null,
        is_active: values.is_active,
      };
      if (values.id) {
        const { error } = await supabase.from("prayer_weeks").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prayer_weeks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Week updated" : "Week added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("prayer_weeks")
        .update({ archived, is_active: archived ? false : true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prayer_weeks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (w: PrayerWeek) => {
    setEditing(w);
    setForm({
      week_start: w.week_start,
      title: w.title,
      intro: w.intro || "",
      points: [0, 1, 2, 3].map(i => w.points?.[i] || emptyPoint(i + 1)),
      conclusion: w.conclusion || "",
      confession_topic: w.confession_topic || "",
      confession_scripture: w.confession_scripture || "",
      affirmations: w.affirmations || "",
      song_title: w.song_title || "",
      song_artist: w.song_artist || "",
      song_url: w.song_url || "",
      song_lyrics: w.song_lyrics || "",
      is_active: w.is_active,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const setPoint = (i: number, field: keyof WeekPoint, value: string) => {
    setForm(f => ({ ...f, points: f.points.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }));
  };

  const visible = weeks.filter(w => !!w.archived === showArchive);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <CalendarRange className="text-accent" size={22} /> Weekly Prayer Bulletin
          </h2>
          <p className="text-sm text-muted-foreground">Four prayer points, confession/affirmations and the song of the week.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowArchive(s => !s)}>
            {showArchive ? <ArchiveRestore size={15} className="mr-1.5" /> : <Archive size={15} className="mr-1.5" />}
            {showArchive ? "Live weeks" : "Archive"}
          </Button>
          <Button size="sm" onClick={openNew}><Plus size={15} className="mr-1.5" /> New week</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {showArchive ? "No archived weeks." : "No weekly bulletin yet — add one."}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(w => (
            <div key={w.id} className="glass-card rounded-xl border border-border/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold">{w.title}</h3>
                    {w.is_active && !w.archived && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/20 text-accent">Live</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Week of {new Date(w.week_start + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{(w.points || []).filter(p => p.focus).length} prayer points
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {w.song_title && <span className="flex items-center gap-1"><Music size={12} /> {w.song_title}</span>}
                    {w.confession_topic && <span className="flex items-center gap-1"><Sparkles size={12} /> {w.confession_topic}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openEdit(w)}><Pencil size={14} /></Button>
                  <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate({ id: w.id, archived: !w.archived })}>
                    {w.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm("Delete this week?")) deleteMutation.mutate(w.id); }}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit week" : "New week"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Week starts (Monday)</Label>
                <Input type="date" value={form.week_start} onChange={e => setForm({ ...form, week_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="Prayer Points for the Week — 10th August, 2026"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Opening message / theme</Label>
              <Textarea rows={4} value={form.intro} onChange={e => setForm({ ...form, intro: e.target.value })} />
            </div>

            <div className="space-y-4">
              <Label className="text-base">The 4 prayer points</Label>
              {form.points.map((p, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input placeholder={`Prayer Point ${i + 1}`} value={p.label} onChange={e => setPoint(i, "label", e.target.value)} />
                    <Input placeholder="00:00 AM to 00:09 AM GMT+1" value={p.time} onChange={e => setPoint(i, "time", e.target.value)} />
                  </div>
                  <Input placeholder="Focus / heading" value={p.focus} onChange={e => setPoint(i, "focus", e.target.value)} />
                  <Textarea rows={2} placeholder="Scripture" value={p.scripture} onChange={e => setPoint(i, "scripture", e.target.value)} />
                  <Textarea rows={5} placeholder="Prayer body" value={p.body} onChange={e => setPoint(i, "body", e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Conclusion (one item per line)</Label>
              <Textarea rows={5} value={form.conclusion} onChange={e => setForm({ ...form, conclusion: e.target.value })} />
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <Label className="text-base">Affirmation / Confession for the week</Label>
              <Input placeholder="Confession guide topic" value={form.confession_topic} onChange={e => setForm({ ...form, confession_topic: e.target.value })} />
              <Textarea rows={3} placeholder="Confession scripture" value={form.confession_scripture} onChange={e => setForm({ ...form, confession_scripture: e.target.value })} />
              <Textarea rows={8} placeholder="Affirmations" value={form.affirmations} onChange={e => setForm({ ...form, affirmations: e.target.value })} />
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <Label className="text-base">Song of the week</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Song title" value={form.song_title} onChange={e => setForm({ ...form, song_title: e.target.value })} />
                <Input placeholder="Artist (e.g. LoveWorld Singers)" value={form.song_artist} onChange={e => setForm({ ...form, song_artist: e.target.value })} />
              </div>
              <Input placeholder="Link (Ceflix / video URL)" value={form.song_url} onChange={e => setForm({ ...form, song_url: e.target.value })} />
              <Textarea rows={8} placeholder="Lyrics" value={form.song_lyrics} onChange={e => setForm({ ...form, song_lyrics: e.target.value })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Show on the website</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button
                  onClick={() => saveMutation.mutate({ ...form, id: editing?.id })}
                  disabled={!form.title || saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save week"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
