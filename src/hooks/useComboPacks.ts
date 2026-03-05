import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComboPack {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  price: number;
  espees_price: number | null;
  ngn_price: number | null;
  featured: boolean;
  is_active: boolean;
  created_at: string;
  books?: ComboPackBook[];
}

export interface ComboPackBook {
  id: string;
  book_id: string;
  combo_pack_id: string;
  books: {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_image_url: string | null;
    is_digital: boolean;
    is_physical: boolean;
    espees_price: number | null;
    ngn_price: number | null;
  };
}

export function useComboPacks() {
  return useQuery({
    queryKey: ["combo-packs-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_packs")
        .select("*")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch items for all combos
      const comboIds = (data as any[]).map((c) => c.id);
      if (comboIds.length === 0) return [] as ComboPack[];

      const { data: items, error: itemsError } = await supabase
        .from("combo_pack_items")
        .select("*, books(id, title, author, price, cover_image_url, is_digital, is_physical, espees_price, ngn_price)")
        .in("combo_pack_id", comboIds);
      if (itemsError) throw itemsError;

      return (data as any[]).map((combo) => ({
        ...combo,
        books: (items as any[]).filter((i) => i.combo_pack_id === combo.id),
      })) as ComboPack[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    networkMode: "always",
  });
}
