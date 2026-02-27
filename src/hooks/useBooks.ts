import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string | null;
  short_description: string | null;
  price: number;
  cover_image_url: string | null;
  is_digital: boolean;
  is_physical: boolean;
  digital_file_url: string | null;
  cloudpdf_document_id: string | null;
  category_id: string | null;
  stock: number;
  pages: number | null;
  isbn: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
}

export interface Category {
  id: string;
  name: string;
}

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(name)")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}
