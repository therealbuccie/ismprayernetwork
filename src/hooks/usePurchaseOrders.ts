import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PurchaseOrder {
  id: string;
  user_id: string;
  items: { book_id: string; title: string; format: string; quantity: number; price: number }[];
  total_amount: number;
  payment_method: string;
  pop_image_url: string | null;
  espees_code: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PurchaseOrder[];
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PurchaseOrder[];
    },
  });
}
