import { supabase } from "@/integrations/supabase/client";

const PIN_KEY = "bookstore_pin";

export function getStoredPin(): string | null {
  return sessionStorage.getItem(PIN_KEY);
}

export function storePin(pin: string) {
  sessionStorage.setItem(PIN_KEY, pin);
}

export function isPublicBookstoreDashboard(): boolean {
  return window.location.pathname.startsWith("/api/bookstore");
}

export async function bookstoreAdminCall(action: string, data: Record<string, any>) {
  const pin = getStoredPin();
  if (!pin) throw new Error("PIN not set");

  const { data: result, error } = await supabase.functions.invoke("bookstore-admin", {
    body: { pin, action, data },
  });

  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}
