import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Purchase {
  id: string;
  user_id: string;
  book_id: string;
  format: "digital" | "physical" | "both";
  status: "pending" | "completed" | "refunded";
  amount: number;
  stripe_payment_id: string | null;
  granted_by: string | null;
  created_at: string;
  books?: {
    id: string;
    title: string;
    author: string;
    cover_image_url: string | null;
    cloudpdf_document_id: string | null;
    description: string | null;
  } | null;
}

export function useMyPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, books(id, title, author, cover_image_url, cloudpdf_document_id, description)")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Purchase[];
    },
  });
}

export function useAllPurchases() {
  return useQuery({
    queryKey: ["all-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, books(id, title, author, cover_image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Purchase[];
    },
  });
}
