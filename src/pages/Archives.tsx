import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Archive, BookOpen, Megaphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Archives = () => {
  const [q, setQ] = useState("");

  const { data: points = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["archived-prayer-points"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_points")
        .select("*")
        .eq("archived", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: announcements = [], isLoading: loadingAnn } = useQuery({
    queryKey: ["archived-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("archived", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const term = q.trim().toLowerCase();
  const filteredPoints = term
    ? points.filter((p) => `${p.title} ${p.category} ${p.scripture} ${p.body}`.toLowerCase().includes(term))
    : points;
  const filteredAnn = term
    ? announcements.filter((a) => `${a.title} ${a.body} ${a.category}`.toLowerCase().includes(term))
    : announcements;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16">
        <div className="hero-gradient py-12 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Archive className="w-10 h-10 text-accent mx-auto mb-3" />
            <h1 className="font-playfair text-3xl md:text-4xl font-bold">Archives</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Past prayer points and announcements from the ISM Prayer Network.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        <Input
          placeholder="Search archives..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-6 max-w-md"
        />

        <Tabs defaultValue="points">
          <TabsList className="mb-6">
            <TabsTrigger value="points" className="gap-2"><BookOpen size={14} /> Prayer Points</TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2"><Megaphone size={14} /> Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            {loadingPoints ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredPoints.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No archived prayer points yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredPoints.map((p) => (
                  <article key={p.id} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-wide text-accent">{p.category}</p>
                    <h2 className="font-semibold mt-1">{p.title}</h2>
                    {p.scripture && <p className="text-sm italic text-muted-foreground mt-1">{p.scripture}</p>}
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{p.body}</p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            {loadingAnn ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredAnn.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No archived announcements yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredAnn.map((a) => (
                  <article key={a.id} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-wide text-accent">{a.category}</p>
                    <h2 className="font-semibold mt-1">{a.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.published_at).toLocaleDateString()}
                    </p>
                    {a.image_url && (
                      <img src={a.image_url} alt={a.title} loading="lazy" className="rounded-lg mt-3 max-h-64 object-cover w-full" />
                    )}
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{a.body}</p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Archives;
