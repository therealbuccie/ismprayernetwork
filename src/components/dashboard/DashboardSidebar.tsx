import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Tag, Users, ArrowLeft, LogOut, Mail, MessageSquare, Flame, CalendarHeart, CalendarDays, Newspaper, HandHeart, UsersRound, ShoppingBag, ClipboardList, Settings, Megaphone, Tv, Banknote, ChevronDown, BarChart3, PackageOpen, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardTab } from "@/pages/Dashboard";
import logo from "@/assets/logo.png";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isSuperAdmin: boolean;
}

interface TabItem {
  id: DashboardTab;
  label: string;
  icon: any;
  superAdminOnly?: boolean;
}

interface TabGroup {
  label: string;
  tabs: TabItem[];
}

const tabGroups: TabGroup[] = [
  {
    label: "Overview",
    tabs: [
      { id: "home", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Bookstore",
    tabs: [
      { id: "books", label: "Books", icon: BookOpen },
      { id: "categories", label: "Categories", icon: Tag },
      { id: "purchases", label: "Purchases", icon: ShoppingBag },
      { id: "orders", label: "Orders", icon: ClipboardList },
      { id: "combo-packs", label: "Combo Packs", icon: PackageOpen },
      { id: "bookstore-analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    tabs: [
      { id: "events", label: "Events", icon: CalendarHeart },
      { id: "programs", label: "Programs", icon: CalendarDays },
      { id: "testimonies", label: "Testimonies", icon: MessageSquare },
      { id: "prayer-requests", label: "Prayer Requests", icon: HandHeart },
      { id: "prayer-groups", label: "Prayer Groups", icon: UsersRound },
      { id: "prayer-points", label: "Prayer Points", icon: BookOpen },
    ],
  },
  {
    label: "Communications",
    tabs: [
      { id: "messages", label: "Messages", icon: Mail },
      { id: "newsletter", label: "Newsletter", icon: Newspaper },
      { id: "campaigns", label: "Campaigns", icon: Megaphone },
      { id: "mail-dispatch", label: "Mail Dispatch", icon: Send },
    ],
  },
  {
    label: "Configuration",
    tabs: [
      { id: "live-tv", label: "Live TV", icon: Tv },
      { id: "payment-settings", label: "Payment Settings", icon: Banknote },
      { id: "settings", label: "General Settings", icon: Settings },
      { id: "database", label: "Database", icon: Database, superAdminOnly: true },
    ],
  },
];

export function DashboardSidebar({ activeTab, onTabChange, isSuperAdmin }: Props) {
  const { signOut } = useAuth();
  const isPublic = window.location.pathname.startsWith("/api/");

  // Determine which groups are open (auto-open group containing active tab)
  const activeGroupIdx = tabGroups.findIndex(g => g.tabs.some(t => t.id === activeTab));
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    tabGroups.forEach((_, i) => { init[i] = true; });
    return init;
  });

  const toggleGroup = (idx: number) => {
    setOpenGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar-background flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
          <p className="text-[10px] text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {tabGroups.map((group, gIdx) => (
            <Collapsible key={group.label} open={openGroups[gIdx]} onOpenChange={() => toggleGroup(gIdx)}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground transition-colors">
                {group.label}
                <ChevronDown size={12} className={`transition-transform ${openGroups[gIdx] ? "rotate-0" : "-rotate-90"}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {group.tabs.map((tab) => {
                  if (tab.superAdminOnly && !isSuperAdmin) return null;
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-1">
        {!isPublic && (
          <>
            <Link
              to="/prayer-room"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Flame size={16} /> Prayer Room
            </Link>
            <Link
              to="/admin"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Back to Hub
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
