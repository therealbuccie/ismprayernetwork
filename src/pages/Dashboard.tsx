import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { BooksManager } from "@/components/dashboard/BooksManager";
import { CategoriesManager } from "@/components/dashboard/CategoriesManager";
import { UsersManager } from "@/components/dashboard/UsersManager";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { ContactMessagesManager } from "@/components/dashboard/ContactMessagesManager";
import { TestimoniesManager } from "@/components/dashboard/TestimoniesManager";

export type DashboardTab = "home" | "books" | "categories" | "users" | "messages" | "testimonies";

const Dashboard = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
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
          {activeTab === "home" && <DashboardHome />}
          {activeTab === "books" && <BooksManager />}
          {activeTab === "categories" && <CategoriesManager />}
          {activeTab === "users" && <UsersManager />}
          {activeTab === "messages" && <ContactMessagesManager />}
          {activeTab === "testimonies" && <TestimoniesManager />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
