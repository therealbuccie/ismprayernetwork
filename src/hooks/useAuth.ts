// Re-export from AuthContext for backward compatibility
// All components using useAuth() will now share the same auth state
export { useAuthContext as useAuth } from "@/contexts/AuthContext";
export type { Profile } from "@/contexts/AuthContext";
