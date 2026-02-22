import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Tag, Users, ArrowLeft, LogOut, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardTab } from "@/pages/Dashboard";
import logo from "@/assets/logo.png";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isSuperAdmin: boolean;
}

const tabs = [
  { id: "home" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "books" as const, label: "Books", icon: BookOpen },
  { id: "categories" as const, label: "Categories", icon: Tag },
  { id: "testimonies" as const, label: "Testimonies", icon: MessageSquare },
  { id: "messages" as const, label: "Messages", icon: Mail },
  { id: "users" as const, label: "Users & Roles", icon: Users, superAdminOnly: true },
];

export function DashboardSidebar({ activeTab, onTabChange, isSuperAdmin }: Props) {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar-background flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
          <p className="text-[10px] text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {tabs.map((tab) => {
          if ((tab as any).superAdminOnly && !isSuperAdmin) return null;
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <ArrowLeft size={18} /> Back to Site
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
