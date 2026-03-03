import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminInsert, adminUpdate, adminDelete } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, Image, Megaphone, X } from "lucide-react";
import type { Campaign } from "@/hooks/useCampaigns";

export function CampaignsManager() {
  const isPublic = isPublicDashboard();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      if (isPublic) {
        const data = await adminQuery("campaigns", "*", undefined, [{ column: "created_at", ascending: false }]);
        return (data ?? []) as Campaign[];
      }
      const { data, error } = await supabase
        .from("campaigns" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((d) => ({ ...d, images: Array.isArray(d.images) ? d.images : [] })) as Campaign[];
    },
  });

  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link_url: "/bookstore",
    is_active: true,
    display_type: "both",
    images: [] as string[],
  });
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || "",
        link_url: editing.link_url,
        is_active: editing.is_active,
        display_type: editing.display_type,
        images: editing.images,
      });
    }
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        if (isPublic) {
          await adminUpdate("campaigns", { id: editing.id, ...form });
        } else {
          const { error } = await supabase
            .from("campaigns" as any)
            .update(form as any)
            .eq("id", editing.id);
          if (error) throw error;
        }
      } else {
        if (isPublic) {
          await adminInsert("campaigns", form);
        } else {
          const { error } = await supabase.from("campaigns" as any).insert(form as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(editing ? "Campaign updated" : "Campaign created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isPublic) {
        await adminDelete("campaigns", id);
      } else {
        const { error } = await supabase.from("campaigns" as any).delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", description: "", link_url: "/bookstore", is_active: true, display_type: "both", images: [] });
    setNewImageUrl("");
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm((f) => ({ ...f, images: [...f.images, newImageUrl.trim()] }));
      setNewImageUrl("");
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Megaphone className="w-7 h-7 text-accent" /> Campaigns
      </h1>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Campaign" : "New Campaign"}</h2>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Campaign title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} />
          </div>
          <div>
            <Label>Link URL</Label>
            <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="/bookstore" />
          </div>
          <div>
            <Label>Display Type</Label>
            <select
              value={form.display_type}
              onChange={(e) => setForm((f) => ({ ...f, display_type: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="both">Both (Popup + Banner)</option>
              <option value="popup">Popup Only</option>
              <option value="banner">Banner Only</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label>Active</Label>
          </div>

          {/* Images */}
          <div>
            <Label className="flex items-center gap-1 mb-2"><Image size={14} /> Campaign Images</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="/images/promo.jpeg or https://..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
              />
              <Button type="button" size="sm" variant="outline" onClick={addImage}><Plus size={14} /></Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title} className="gap-2">
              <Save size={16} /> {editing ? "Update" : "Create"}
            </Button>
            {editing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {campaigns?.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            {c.images[0] && <img src={c.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{c.title}</h3>
              <p className="text-xs text-muted-foreground">{c.display_type} · {c.is_active ? "Active" : "Inactive"} · {c.images.length} images</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 size={14} /></Button>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <p className="text-muted-foreground text-sm">No campaigns yet.</p>
        )}
      </div>
    </div>
  );
}
