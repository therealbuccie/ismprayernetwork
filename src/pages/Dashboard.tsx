import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar, tabGroups } from "@/components/dashboard/DashboardSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu, ChevronRight, Flame, Tv, ExternalLink, LogOut,
  Settings, ScrollText, Database, ShieldCheck, CheckCircle2,
  Bell, Sparkles, RefreshCw
} from "lucide-react";

const DashboardHome = lazy(() => import("@/components/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const BooksManager = lazy(() => import("@/components/dashboard/BooksManager").then(m => ({ default: m.BooksManager })));
const CategoriesManager = lazy(() => import("@/components/dashboard/CategoriesManager").then(m => ({ default: m.CategoriesManager })));
const UsersManager = lazy(() => import("@/components/dashboard/UsersManager").then(m => ({ default: m.UsersManager })));
const DatabaseManager = lazy(() => import("@/components/dashboard/DatabaseManager").then(m => ({ default: m.DatabaseManager })));
const ContactMessagesManager = lazy(() => import("@/components/dashboard/ContactMessagesManager").then(m => ({ default: m.ContactMessagesManager })));
const TestimoniesManager = lazy(() => import("@/components/dashboard/TestimoniesManager").then(m => ({ default: m.TestimoniesManager })));
const EventsManager = lazy(() => import("@/components/dashboard/EventsManager").then(m => ({ default: m.EventsManager })));
const ProgramsManager = lazy(() => import("@/components/dashboard/ProgramsManager").then(m => ({ default: m.ProgramsManager })));
const NewsletterManager = lazy(() => import("@/components/dashboard/NewsletterManager").then(m => ({ default: m.NewsletterManager })));
const PrayerRequestsManager = lazy(() => import("@/components/dashboard/PrayerRequestsManager").then(m => ({ default: m.PrayerRequestsManager })));
const PrayerGroupsManager = lazy(() => import("@/components/dashboard/PrayerGroupsManager").then(m => ({ default: m.PrayerGroupsManager })));
const PurchasesManager = lazy(() => import("@/components/dashboard/PurchasesManager").then(m => ({ default: m.PurchasesManager })));
const OrdersManager = lazy(() => import("@/components/dashboard/OrdersManager").then(m => ({ default: m.OrdersManager })));
const SiteSettingsManager = lazy(() => import("@/components/dashboard/SiteSettingsManager").then(m => ({ default: m.SiteSettingsManager })));

const CampaignsManager = lazy(() => import("@/components/dashboard/CampaignsManager").then(m => ({ default: m.CampaignsManager })));
const LiveTVManager = lazy(() => import("@/components/dashboard/LiveTVManager").then(m => ({ default: m.LiveTVManager })));
const PaymentSettingsManager = lazy(() => import("@/components/dashboard/PaymentSettingsManager").then(m => ({ default: m.PaymentSettingsManager })));
const BookstoreAnalytics = lazy(() => import("@/components/dashboard/BookstoreAnalytics").then(m => ({ default: m.BookstoreAnalytics })));

const ComboPacksManager = lazy(() => import("@/components/dashboard/ComboPacksManager").then(m => ({ default: m.ComboPacksManager })));
const MailDispatchManager = lazy(() => import("@/components/dashboard/MailDispatchManager").then(m => ({ default: m.MailDispatchManager })));
const ReportsManager = lazy(() => import("@/components/dashboard/ReportsManager").then(m => ({ default: m.ReportsManager })));
const AnnouncementsManager = lazy(() => import("@/components/dashboard/AnnouncementsManager").then(m => ({ default: m.AnnouncementsManager })));
const WeeklyPrayerManager = lazy(() => import("@/components/dashboard/WeeklyPrayerManager").then(m => ({ default: m.WeeklyPrayerManager })));
const PrayerPointsManager = lazy(() => import("@/components/dashboard/PrayerPointsManager").then(m => ({ default: m.PrayerPointsManager })));
const ActivityLogManager = lazy(() => import("@/components/dashboard/ActivityLogManager").then(m => ({ default: m.ActivityLogManager })));
const ProgramTrackerManager = lazy(() => import("@/components/dashboard/ProgramTrackerManager").then(m => ({ default: m.ProgramTrackerManager })));

export type DashboardTab = "home" | "books" | "categories" | "purchases" | "orders" | "combo-packs" | "bookstore-analytics" | "settings" | "database" | "users" | "messages" | "testimonies" | "events" | "programs" | "newsletter" | "prayer-requests" | "prayer-groups" | "prayer-points" | "weekly-prayer" | "campaigns" | "live-tv" | "payment-settings" | "mail-dispatch" | "reports" | "announcements" | "program-tracker" | "activity-log";

function TabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

const Dashboard = () => {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && user && profile && !isAdmin) {
      navigate("/auth");
    }
  }, [loading, user, profile, isAdmin, navigate]);

  // Derive current tab info and section for breadcrumbs
  const currentTabMeta = useMemo(() => {
    for (const group of tabGroups) {
      const found = group.tabs.find(t => t.id === activeTab);
      if (found) {
        return { group: group.label, tab: found.label, icon: found.icon };
      }
    }
    return { group: "Overview", tab: "Dashboard", icon: null };
  }, [activeTab]);

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

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading Executive Portal...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const isSuperAdmin = profile?.role === "super-admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border/60 bg-sidebar">
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={(t) => {
              setActiveTab(t);
              setMobileOpen(false);
            }}
            isSuperAdmin={isSuperAdmin}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Execution Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Executive Sticky Topbar */}
        <header className="sticky top-0 z-20 h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile trigger & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-1.5 text-xs font-medium min-w-0 truncate">
              <button
                onClick={() => setActiveTab("home")}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                Portal
              </button>
              <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
              <span className="text-muted-foreground/70 hidden sm:inline truncate">{currentTabMeta.group}</span>
              <ChevronRight size={12} className="text-muted-foreground/40 hidden sm:inline shrink-0" />
              <span className="text-foreground font-semibold flex items-center gap-1.5 truncate">
                {currentTabMeta.tab}
              </span>
            </nav>
          </div>

          {/* Right: Live System Status, Shortcuts & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Infrastructure Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Cloudflare & Supabase Live</span>
            </div>

            {/* Quick Action Shortcuts */}
            <button
              onClick={() => setActiveTab("live-tv")}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                activeTab === "live-tv"
                  ? "bg-accent/15 border-accent text-accent font-semibold"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Open Live TV Broadcast Operations"
            >
              <Tv size={13} className="text-rose-500" />
              <span>Live TV</span>
            </button>

            <Link
              to="/prayer-room"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Launch Live Prayer Room"
            >
              <Flame size={13} className="text-orange-500" />
              <span>Prayer Room</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Open Public Website"
            >
              <span className="hidden sm:inline">Website</span>
              <ExternalLink size={13} />
            </Link>

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* Executive Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-accent/40 transition-all focus:outline-none">
                  <Avatar className="h-8 w-8 rounded-full border border-accent/40 shadow-sm">
                    <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 bg-popover/95 backdrop-blur-xl border-border/60 shadow-xl">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {profile?.full_name || "Administrator"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <Badge variant="outline" className="w-fit text-[9px] px-1.5 py-0 border-accent/30 text-accent bg-accent/5 mt-0.5">
                      {isSuperAdmin ? "Super Administrator" : "Administrator"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  onClick={() => setActiveTab("settings")}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Settings size={14} className="text-muted-foreground" />
                  <span>Site Settings</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem
                    onClick={() => setActiveTab("database")}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Database size={14} className="text-muted-foreground" />
                    <span>Database Manager</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setActiveTab("activity-log")}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <ScrollText size={14} className="text-muted-foreground" />
                  <span>Activity Log</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-xs gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === "home" && <DashboardHome onNavigate={(t) => setActiveTab(t as DashboardTab)} />}
              {activeTab === "books" && <BooksManager />}
              {activeTab === "categories" && <CategoriesManager />}
              {activeTab === "users" && <UsersManager />}
              {activeTab === "database" && <DatabaseManager />}
              {activeTab === "messages" && <ContactMessagesManager />}
              {activeTab === "testimonies" && <TestimoniesManager />}
              {activeTab === "events" && <EventsManager />}
              {activeTab === "programs" && <ProgramsManager />}
              {activeTab === "newsletter" && <NewsletterManager />}
              {activeTab === "prayer-requests" && <PrayerRequestsManager />}
              {activeTab === "prayer-groups" && <PrayerGroupsManager />}
              {activeTab === "prayer-points" && <PrayerPointsManager />}
              {activeTab === "weekly-prayer" && <WeeklyPrayerManager />}
              {activeTab === "purchases" && <PurchasesManager />}
              {activeTab === "orders" && <OrdersManager />}
              {activeTab === "combo-packs" && <ComboPacksManager />}
              {activeTab === "bookstore-analytics" && <BookstoreAnalytics />}
              {activeTab === "campaigns" && <CampaignsManager />}
              {activeTab === "live-tv" && <LiveTVManager />}
              {activeTab === "payment-settings" && <PaymentSettingsManager />}
              {activeTab === "settings" && <SiteSettingsManager />}
              {activeTab === "mail-dispatch" && <MailDispatchManager />}
              {activeTab === "reports" && <ReportsManager />}
              {activeTab === "announcements" && <AnnouncementsManager />}
              {activeTab === "program-tracker" && <ProgramTrackerManager />}
              {activeTab === "activity-log" && <ActivityLogManager />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
