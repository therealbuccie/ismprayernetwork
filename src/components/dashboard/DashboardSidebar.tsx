import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Tag, Users, ArrowLeft, LogOut, Mail,
  MessageSquare, Flame, CalendarHeart, CalendarDays, Newspaper,
  HandHeart, UsersRound, ShoppingBag, ClipboardList, Settings,
  Megaphone, Tv, Banknote, ChevronDown, BarChart3, PackageOpen,
  Send, Database, ClipboardCheck, Bell, Activity, ScrollText,
  Search, ExternalLink, ShieldCheck, Sparkles, X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardTab } from "@/pages/Dashboard";
import logo from "@/assets/logo.png";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isSuperAdmin: boolean;
  onCloseMobile?: () => void;
}

export interface TabItem {
  id: DashboardTab;
  label: string;
  icon: any;
  superAdminOnly?: boolean;
  badge?: string;
}

export interface TabGroup {
  label: string;
  tabs: TabItem[];
}

export const tabGroups: TabGroup[] = [
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
      { id: "prayer-points", label: "Prayer Points", icon: Sparkles },
      { id: "weekly-prayer", label: "Weekly Bulletin", icon: BookOpen },
      { id: "reports", label: "Reports", icon: ClipboardCheck },
    ],
  },
  {
    label: "Communications",
    tabs: [
      { id: "messages", label: "Messages", icon: Mail },
      { id: "newsletter", label: "Newsletter", icon: Newspaper },
      { id: "campaigns", label: "Campaigns", icon: Megaphone },
      { id: "announcements", label: "Announcements", icon: Bell },
      { id: "mail-dispatch", label: "Mail Dispatch", icon: Send },
      { id: "program-tracker", label: "Program Tracker", icon: Activity },
    ],
  },
  {
    label: "Configuration",
    tabs: [
      { id: "live-tv", label: "Live TV", icon: Tv },
      { id: "payment-settings", label: "Payment Settings", icon: Banknote },
      { id: "settings", label: "General Settings", icon: Settings },
      { id: "database", label: "Database", icon: Database, superAdminOnly: true },
      { id: "activity-log", label: "Activity Log", icon: ScrollText },
    ],
  },
];

export function DashboardSidebar({ activeTab, onTabChange, isSuperAdmin, onCloseMobile }: Props) {
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Determine active group
  const activeGroupIdx = tabGroups.findIndex(g => g.tabs.some(t => t.id === activeTab));
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    tabGroups.forEach((_, i) => { init[i] = true; }); // Default all open for fast scanning
    return init;
  });

  // Open the group containing the active tab
  useEffect(() => {
    if (activeGroupIdx >= 0) {
      setOpenGroups(prev => (prev[activeGroupIdx] ? prev : { ...prev, [activeGroupIdx]: true }));
    }
  }, [activeGroupIdx]);

  const toggleGroup = (idx: number) => {
    setOpenGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSelectTab = (tabId: DashboardTab) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Filter tabs by search
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabGroups;

    return tabGroups
      .map(group => ({
        ...group,
        tabs: group.tabs.filter(tab => {
          if (tab.superAdminOnly && !isSuperAdmin) return false;
          return tab.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q);
        }),
      }))
      .filter(group => group.tabs.length > 0);
  }, [searchQuery, isSuperAdmin]);

  const initials = useMemo(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(" ");
      return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "AD";
  }, [profile, user]);

  return (
    <aside className="w-64 shrink-0 border-r border-border/60 bg-sidebar/95 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-30 selection:bg-accent selection:text-accent-foreground">
      {/* Brand & Organization Header */}
      <div className="p-4 border-b border-border/50 bg-sidebar/50">
        <div className="flex items-center gap-3">
          <div className="relative p-1.5 rounded-xl bg-accent/10 border border-accent/25 shadow-sm shadow-accent/10 flex items-center justify-center shrink-0">
            <img src={logo} alt="ISM Logo" className="h-7 w-7 object-contain drop-shadow" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-wider uppercase text-foreground truncate">
                ISM Network
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-semibold tracking-wide border-accent/30 text-accent bg-accent/5">
                {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate">v2.0 Live</span>
            </div>
          </div>
        </div>

        {/* Quick Search Tabs */}
        <div className="relative mt-3">
          <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tabs (e.g. mail, books)..."
            className="w-full bg-background/50 border border-border/60 rounded-lg pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/80 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        <nav className="space-y-4">
          {filteredGroups.map((group, gIdx) => {
            const isOpen = searchQuery.trim().length > 0 || openGroups[gIdx];
            return (
              <Collapsible
                key={group.label}
                open={isOpen}
                onOpenChange={() => toggleGroup(gIdx)}
                className="space-y-1"
              >
                <CollapsibleTrigger className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors group">
                  <span className="flex items-center gap-1.5">
                    {group.label}
                    <span className="text-[10px] font-normal text-muted-foreground/50">({group.tabs.length})</span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-muted-foreground/50 group-hover:text-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5 pt-1">
                  {group.tabs.map((tab) => {
                    if (tab.superAdminOnly && !isSuperAdmin) return null;
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                          active
                            ? "bg-accent/15 text-accent font-semibold shadow-sm border-l-2 border-accent pl-2"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={15}
                            className={`shrink-0 transition-colors ${
                              active ? "text-accent drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" : "text-muted-foreground group-hover:text-foreground"
                            }`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(234,179,8,0.8)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User & System Status Card at Bottom */}
      <div className="p-3 border-t border-border/50 bg-sidebar/60 space-y-2.5">
        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-card/40 border border-border/40">
          <Avatar className="h-8 w-8 rounded-lg border border-accent/30 shrink-0">
            <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {profile?.full_name || user?.email?.split("@")[0] || "Administrator"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.email || "Super Admin"}
            </p>
          </div>
        </div>

        {/* Quick Links & Sign Out */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <Link
            to="/prayer-room"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/40"
          >
            <Flame size={12} className="text-orange-500" />
            <span>Prayer Room</span>
          </Link>
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/40"
          >
            <ExternalLink size={12} className="text-sky-500" />
            <span>Live Site</span>
          </Link>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
