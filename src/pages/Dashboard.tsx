import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardHome = lazy(() => import("@/components/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const BooksManager = lazy(() => import("@/components/dashboard/BooksManager").then(m => ({ default: m.BooksManager })));
const CategoriesManager = lazy(() => import("@/components/dashboard/CategoriesManager").then(m => ({ default: m.CategoriesManager })));
const UsersManager = lazy(() => import("@/components/dashboard/UsersManager").then(m => ({ default: m.UsersManager })));
const ContactMessagesManager = lazy(() => import("@/components/dashboard/ContactMessagesManager").then(m => ({ default: m.ContactMessagesManager })));
const TestimoniesManager = lazy(() => import("@/components/dashboard/TestimoniesManager").then(m => ({ default: m.TestimoniesManager })));

export type DashboardTab = "home" | "books" | "categories" | "users" | "messages" | "testimonies";

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

const Dashboard = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && user && profile && !isAdmin) {
      navigate("/auth");
    }
  }, [loading, user, profile, isAdmin, navigate]);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} isSuperAdmin={profile?.role === "super-admin"} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === "home" && <DashboardHome />}
            {activeTab === "books" && <BooksManager />}
            {activeTab === "categories" && <CategoriesManager />}
            {activeTab === "users" && <UsersManager />}
            {activeTab === "messages" && <ContactMessagesManager />}
            {activeTab === "testimonies" && <TestimoniesManager />}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
