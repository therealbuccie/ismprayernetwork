import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [loading, user]);

  // Close modal if user logs in
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </div>
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
