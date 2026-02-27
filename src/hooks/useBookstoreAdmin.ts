import { supabase } from "@/integrations/supabase/client";
import { createContext, useContext } from "react";

const PIN_KEY = "dashboard_pin";
const BOOKSTORE_PIN_KEY = "bookstore_pin";

export function getStoredPin(): string | null {
  return sessionStorage.getItem(PIN_KEY) || sessionStorage.getItem(BOOKSTORE_PIN_KEY);
}

export function storePin(pin: string, key: string = PIN_KEY) {
  sessionStorage.setItem(key, pin);
}

export function isPublicDashboard(): boolean {
  return window.location.pathname.startsWith("/api/dashboard") || window.location.pathname.startsWith("/api/bookstore");
}

// Renamed export for backward compat
export const isPublicBookstoreDashboard = isPublicDashboard;

export async function dashboardAdminCall(action: string, params: Record<string, any> = {}) {
  const pin = getStoredPin();
  if (!pin) throw new Error("PIN not set");

  const { data: result, error } = await supabase.functions.invoke("dashboard-admin", {
    body: { pin, action, ...params },
  });

  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}

// Convenience wrappers
export async function adminQuery(table: string, select = "*", filters?: any[], order?: any[]) {
  return dashboardAdminCall("select", { table, select, filters, order });
}

export async function adminInsert(table: string, data: Record<string, any>) {
  return dashboardAdminCall("insert", { table, data });
}

export async function adminUpdate(table: string, data: Record<string, any>) {
  return dashboardAdminCall("update", { table, data });
}

export async function adminDelete(table: string, id: string) {
  return dashboardAdminCall("delete", { table, data: { id } });
}

export async function adminUpsert(table: string, data: Record<string, any>, match?: string) {
  return dashboardAdminCall("upsert", { table, data, match });
}

export async function adminCount(table: string) {
  const result = await dashboardAdminCall("count", { table });
  return result.count;
}

// Keep old bookstore-specific function working
export async function bookstoreAdminCall(action: string, data: Record<string, any>) {
  const tableMap: Record<string, string> = {
    insert_book: "books", update_book: "books", delete_book: "books",
    insert_category: "categories", update_category: "categories", delete_category: "categories",
  };
  const actionMap: Record<string, string> = {
    insert_book: "insert", update_book: "update", delete_book: "delete",
    insert_category: "insert", update_category: "update", delete_category: "delete",
  };
  const table = tableMap[action];
  const dbAction = actionMap[action];
  if (!table || !dbAction) throw new Error("Unknown action: " + action);

  return dashboardAdminCall(dbAction, { table, data });
}
