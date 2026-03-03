import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  link_url: string;
  is_active: boolean;
  display_type: string;
  created_at: string;
  updated_at: string;
}

export function useCampaigns(displayType?: "popup" | "banner" | "both") {
  return useQuery({
    queryKey: ["campaigns", displayType],
    queryFn: async () => {
      let query = supabase
        .from("campaigns" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (displayType && displayType !== "both") {
        query = query.or(`display_type.eq.${displayType},display_type.eq.both`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        images: Array.isArray(d.images) ? d.images : [],
      })) as Campaign[];
    },
  });
}
