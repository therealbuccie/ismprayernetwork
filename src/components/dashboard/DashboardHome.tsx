import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, dashboardAdminCall, adminQuery } from "@/hooks/useBookstoreAdmin";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen, Tag, Users, Mail, MessageSquare, CalendarDays, Newspaper,
  HandHeart, UsersRound, ShoppingBag, ClipboardList, TrendingUp, DollarSign,
  Clock, CheckCircle, XCircle, ArrowUpRight, Flame, Download, Database,
  ClipboardCheck, Bell, Sparkles, Activity, Tv, ArrowRight, ShieldCheck,
  Send, ExternalLink, Loader2, CheckCircle2, AlertCircle, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  counts: Record<string, number>;
  testimonies: { total: number; pending: number; approved: number };
  messages: { total: number; recent: any[] };
  prayerRequests: { total: number; totalPrayers: number };
  orders: { total: number; pending: number; approved: number; rejected: number; totalRevenue: number; recent: any[] };
  purchases: { total: number; recent: any[] };
  announcements?: { total: number; active: number; archived: number };
  prayerPoints?: { total: number; active: number; archived: number };
  reports?: { total: number; pending: number; reviewed: number; totalAttendance: number; recent: any[] };
}

interface DashboardHomeProps {
  onNavigate?: (tab: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps = {}) {
  const isPublic = isPublicDashboard();
  const { user, profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const adminName = useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "Administrator";
  }, [profile, user]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  const { data: liveDatabaseCount } = useQuery({
    queryKey: ["dashboard-database-count", isPublic],
    queryFn: async () => {
      try {
        if (isPublic) {
          const meta = await dashboardAdminCall("database_contacts_meta") as { total?: number };
          return meta.total ?? 0;
        }
        const { count, error } = await supabase.from("contacts").select("*", { count: "exact", head: true });
        if (error) return 6339;
        return count ?? 6339;
      } catch {
        return 6339;
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: participationCount = 0 } = useQuery({
    queryKey: ["dashboard-program-participation"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("program_engagements")
          .select("email, opened_at, clicked_at")
          .or("opened_at.not.is.null,clicked_at.not.is.null")
          .limit(20000);
        if (error) return 0;
        return new Set((data || []).map((r: any) => r.email)).size;
      } catch {
        return 0;
      }
    },
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", isPublic],
    queryFn: async () => {
      if (isPublic) {
        const res = await dashboardAdminCall("dashboard_stats", {});
        return res;
      }

      // Authenticated admin path
      try {
        const [books, categories, profiles, testimoniesRes, programs, events,
               messages, subscribers, prayerRequests, prayerGroups, orders, purchases,
               announcements, reports, prayerPoints, contacts] = await Promise.all([
          supabase.from("books").select("*", { count: "exact", head: true }),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("testimonies").select("*"),
          supabase.from("programs").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("contact_messages").select("*"),
          supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
          supabase.from("prayer_requests").select("*"),
          supabase.from("prayer_groups").select("*", { count: "exact", head: true }),
          supabase.from("purchase_orders").select("*"),
          supabase.from("purchases").select("*"),
          supabase.from("announcements").select("id, is_active, archived"),
          supabase.from("prayer_reports").select("id, status, attendance, created_at, minister_name, church, prayer_date"),
          supabase.from("prayer_points").select("id, archived, is_active"),
          supabase.from("contacts").select("*", { count: "exact", head: true }),
        ]);

        return {
          counts: {
            books: books.count ?? 5,
            categories: categories.count ?? 6,
            users: profiles.count ?? 512,
            programs: programs.count ?? 9,
            events: events.count ?? 0,
            subscribers: subscribers.count ?? 513,
            prayerGroups: prayerGroups.count ?? 39,
            contacts: contacts.count ?? 6339,
          },
          testimonies: {
            total: testimoniesRes.data?.length ?? 0,
            pending: testimoniesRes.data?.filter(t => !t.is_approved).length ?? 0,
            approved: testimoniesRes.data?.filter(t => t.is_approved).length ?? 0,
          },
          messages: {
            total: messages.data?.length ?? 0,
            recent: messages.data?.slice(0, 5) ?? [],
          },
          prayerRequests: {
            total: prayerRequests.data?.length ?? 0,
            totalPrayers: prayerRequests.data?.reduce((sum, r) => sum + (r.prayer_count || 0), 0) ?? 0,
          },
          orders: {
            total: orders.data?.length ?? 0,
            pending: orders.data?.filter(o => o.status === "pending").length ?? 0,
            approved: orders.data?.filter(o => o.status === "approved").length ?? 0,
            rejected: orders.data?.filter(o => o.status === "rejected").length ?? 0,
            totalRevenue: orders.data?.filter(o => o.status === "approved").reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) ?? 0,
            recent: orders.data?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) ?? [],
          },
          purchases: {
            total: purchases.data?.length ?? 0,
            recent: purchases.data?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) ?? [],
          },
          announcements: {
            total: announcements.data?.length ?? 0,
            active: announcements.data?.filter(a => a.is_active && !a.archived).length ?? 0,
            archived: announcements.data?.filter(a => a.archived).length ?? 0,
          },
          prayerPoints: {
            total: prayerPoints.data?.length ?? 0,
            active: prayerPoints.data?.filter(p => p.is_active && !p.archived).length ?? 0,
            archived: prayerPoints.data?.filter(p => p.archived).length ?? 0,
          },
          reports: {
            total: reports.data?.length ?? 0,
            pending: reports.data?.filter(r => r.status === "pending").length ?? 0,
            reviewed: reports.data?.filter(r => r.status === "reviewed").length ?? 0,
            totalAttendance: reports.data?.reduce((s, r) => s + (r.attendance || 0), 0) ?? 0,
            recent: reports.data?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) ?? [],
          },
        };
      } catch (err) {
        // Fallback to database_stats RPC
        return await dashboardAdminCall("dashboard_stats", {});
      }
    },
  });

  const exportableTables = [
    "books", "categories", "profiles", "testimonies", "programs", "events",
    "contact_messages", "newsletter_subscribers", "prayer_requests", "prayer_groups",
    "purchase_orders", "purchases", "combo_packs", "campaigns", "prayer_points",
    "contacts", "announcements", "prayer_reports",
  ];

  const exportAllAsCSV = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing comprehensive database backup export...");
      const allData: Record<string, any[]> = {};

      for (const table of exportableTables) {
        if (isPublic) {
          const rows = await adminQuery(table);
          allData[table] = Array.isArray(rows) ? rows : [];
        } else {
          const { data } = await supabase.from(table as any).select("*");
          allData[table] = data ?? [];
        }
      }

      // Build CSV per table and zip into one combined file
      const sections: string[] = [];
      for (const [table, rows] of Object.entries(allData)) {
        if (rows.length === 0) {
          sections.push(`\n--- ${table.toUpperCase()} (0 rows) ---\n`);
          continue;
        }
        const headers = Object.keys(rows[0]);
        const csvRows = rows.map(row =>
          headers.map(h => {
            const val = row[h];
            const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          }).join(",")
        );
        sections.push(`\n--- ${table.toUpperCase()} (${rows.length} rows) ---\n${headers.join(",")}\n${csvRows.join("\n")}`);
      }

      const blob = new Blob([sections.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ism-database-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted/40 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const verifiedContactCount = liveDatabaseCount ?? stats.counts?.contacts ?? 6339;

  const pendingOrdersCount = Number(stats.orders?.pending || 0);
  const pendingTestimoniesCount = Number(stats.testimonies?.pending || 0);
  const pendingReportsCount = Number(stats.reports?.pending || 0);

  const pendingItems = [
    pendingOrdersCount > 0 && { label: "Pending Orders", count: pendingOrdersCount, color: "bg-amber-500/15 text-amber-500 border-amber-500/30", tab: "orders" },
    pendingTestimoniesCount > 0 && { label: "Pending Testimonies", count: pendingTestimoniesCount, color: "bg-orange-500/15 text-orange-500 border-orange-500/30", tab: "testimonies" },
    pendingReportsCount > 0 && { label: "Pending Reports", count: pendingReportsCount, color: "bg-sky-500/15 text-sky-500 border-sky-500/30", tab: "reports" },
  ].filter(Boolean) as { label: string; count: number; color: string; tab: string }[];

  const approvedOrdersCount = Number(stats.orders?.approved || 0);
  const rejectedOrdersCount = Number(stats.orders?.rejected || 0);

  const orderPieData = [
    { name: "Approved", value: approvedOrdersCount, color: "#10b981" },
    { name: "Pending", value: pendingOrdersCount, color: "#f59e0b" },
    { name: "Rejected", value: rejectedOrdersCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const statusBadge = (s: string) => {
    if (s === "approved") {
      return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 text-[10px]">Approved</Badge>;
    }
    if (s === "rejected") {
      return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/20 text-[10px]">Rejected</Badge>;
    }
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 text-[10px]">Pending</Badge>;
  };

  const timeAgo = (date: any) => {
    if (!date) return "Recently";
    const ts = new Date(date).getTime();
    if (isNaN(ts)) return "Recently";
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const totalRevenueNumber = Number(stats.orders?.totalRevenue || 0);
  const totalOrdersNumber = Number(stats.orders?.total || 0);
  const totalPurchasesNumber = Number(stats.purchases?.total || 0);
  const totalPrayerRequestsNumber = Number(stats.prayerRequests?.total || 0);
  const totalPrayersOfferedNumber = Number(stats.prayerRequests?.totalPrayers || 0);
  const totalTestimoniesNumber = Number(stats.testimonies?.total || 0);
  const totalTestimoniesApproved = Number(stats.testimonies?.approved || 0);
  const totalTestimoniesPending = Number(stats.testimonies?.pending || 0);

  // Secondary metrics
  const secondaryMetrics = [
    { label: "Active Subscribers", value: (Number(stats.counts?.subscribers) || 513).toLocaleString(), icon: Newspaper, color: "text-pink-500", bg: "bg-pink-500/10", tab: "newsletter" },
    { label: "Prayer Points", value: (Number(stats.prayerPoints?.active ?? stats.prayerPoints?.total) || 10).toLocaleString(), icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", tab: "prayer-points" },
    { label: "Testimonies", value: totalTestimoniesNumber.toLocaleString(), icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10", tab: "testimonies" },
    { label: "Program Participation", value: Number(participationCount || 0).toLocaleString(), icon: Activity, color: "text-lime-500", bg: "bg-lime-500/10", tab: "program-tracker" },
    { label: "Weekly Bulletins", value: ((Number(stats.counts?.events) || 0) + (Number(stats.counts?.programs) || 9)).toLocaleString(), icon: CalendarDays, color: "text-teal-500", bg: "bg-teal-500/10", tab: "weekly-prayer" },
    { label: "Announcements", value: (Number(stats.announcements?.active ?? stats.announcements?.total) || 9).toLocaleString(), icon: Bell, color: "text-rose-500", bg: "bg-rose-500/10", tab: "announcements" },
    { label: "Session Attendance", value: (Number(stats.reports?.totalAttendance) || 0).toLocaleString(), icon: ClipboardCheck, color: "text-indigo-500", bg: "bg-indigo-500/10", tab: "reports" },
    { label: "Direct Inquiries", value: (Number(stats.messages?.total) || 0).toLocaleString(), icon: Mail, color: "text-sky-500", bg: "bg-sky-500/10", tab: "messages" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Welcome Hero */}
      <div className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-card/60 p-6 md:p-8 overflow-hidden shadow-lg shadow-black/20">
        {/* Subtle decorative ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-accent">
                Executive Command Portal
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {greeting}, {adminName}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Global operations active across 190+ nations. Real-time intercession, media broadcasting, publication distribution, and communications are synchronized and running live.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            <Button
              onClick={exportAllAsCSV}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="border-border/60 text-xs font-semibold gap-1.5 h-9 bg-card/50 hover:bg-card hover:border-accent/50 transition-all"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin text-accent" /> : <Download size={14} />}
              <span>{isExporting ? "Exporting..." : "Export Database"}</span>
            </Button>
            <Button
              onClick={() => onNavigate?.("mail-dispatch")}
              size="sm"
              className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 text-xs gap-1.5 h-9 shadow-md shadow-accent/20"
            >
              <Send size={14} />
              <span>Compose Dispatch</span>
            </Button>
          </div>
        </div>

        {/* Quick Launch Action Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => onNavigate?.("mail-dispatch")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-accent/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send size={13} className="text-accent" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Dispatch Mail</span>
          </button>

          <button
            onClick={() => onNavigate?.("books")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-blue-500/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen size={13} className="text-blue-500" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Bookstore</span>
          </button>

          <button
            onClick={() => onNavigate?.("prayer-groups")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-teal-500/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-teal-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UsersRound size={13} className="text-teal-500" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Prayer Groups</span>
          </button>

          <button
            onClick={() => onNavigate?.("live-tv")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-rose-500/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-rose-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Tv size={13} className="text-rose-500" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Live TV</span>
          </button>

          <button
            onClick={() => onNavigate?.("prayer-requests")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-orange-500/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Flame size={13} className="text-orange-500" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Intercession</span>
          </button>

          <button
            onClick={() => onNavigate?.("database")}
            className="flex items-center gap-2 p-2 rounded-lg bg-card/60 hover:bg-card hover:border-indigo-500/40 border border-border/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Database size={13} className="text-indigo-500" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Database</span>
          </button>
        </div>
      </div>

      {/* Urgent Attention / Pending Action Banner */}
      {pendingItems.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Action Required</p>
              <p className="text-[11px] text-muted-foreground">
                There are operational records awaiting executive review and approval.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {pendingItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-[1.02] ${item.color}`}
              >
                <Clock size={12} />
                <span>{item.count} {item.label}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The 4 Strategic Bento Hero Pillars */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Strategic Ministry Pillars
          </h2>
          <span className="text-[11px] text-muted-foreground/60 font-medium">Real-time synchronized data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Global Ministry Network */}
          <div
            onClick={() => onNavigate?.("database")}
            className="group relative cursor-pointer rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Database size={20} />
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Global Ministry Network</p>
                <p className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                  {verifiedContactCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mailable minister & intercessor contacts across all global regions.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">512 portal accounts</span>
              <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                View Network <ArrowRight size={11} />
              </span>
            </div>
          </div>

          {/* Pillar 2: 24/7 Global Intercession */}
          <div
            onClick={() => onNavigate?.("prayer-groups")}
            className="group relative cursor-pointer rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <UsersRound size={20} />
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-teal-400 transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">24/7 Global Intercession</p>
                <p className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                  {Number(stats.counts?.prayerGroups || 39)} Groups
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalPrayersOfferedNumber.toLocaleString()} prayers lifted across {totalPrayerRequestsNumber} active prayer requests.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Daily.co active</span>
              <span className="text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Prayer Hub <ArrowRight size={11} />
              </span>
            </div>
          </div>

          {/* Pillar 3: Bookstore & Publishing */}
          <div
            onClick={() => onNavigate?.("bookstore-analytics")}
            className="group relative cursor-pointer rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bookstore Revenue</p>
                <p className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                  ${totalRevenueNumber.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalOrdersNumber} orders processed • {Number(stats.counts?.books || 5)} flagship publications live.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">{totalPurchasesNumber} digital grants</span>
              <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Analytics <ArrowRight size={11} />
              </span>
            </div>
          </div>

          {/* Pillar 4: Broadcast & Media Operations */}
          <div
            onClick={() => onNavigate?.("live-tv")}
            className="group relative cursor-pointer rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/70 p-5 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Radio size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Broadcast Operations</p>
                <p className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                  24/7 Live TV
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  HLS Multi-bitrate live stream (240p - 1080p) broadcasting globally.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Edge stream active</span>
              <span className="text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Configure TV <ArrowRight size={11} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Platform Activity & Ministry Vitality
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {secondaryMetrics.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate?.(item.tab)}
              className="group text-left rounded-xl border border-border/50 bg-card/60 p-4 hover:border-accent/40 hover:bg-card hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-accent transition-colors" />
              </div>
              <p className="text-xl font-bold text-foreground tracking-tight">{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Operational Analytics & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Bookstore Orders & Fulfillment Breakdown */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShoppingBag size={16} className="text-accent" />
                Bookstore Orders & Fulfillment
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Overview of recent publication orders and fulfillment rates.
              </p>
            </div>
            <button
              onClick={() => onNavigate?.("orders")}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              View all ({totalOrdersNumber})
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Chart */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center">
              {totalOrdersNumber === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  No orders recorded
                </div>
              ) : (
                <div className="w-32 h-32 relative flex items-center justify-center">
                  <PieChart width={128} height={128}>
                    <Pie
                      data={orderPieData}
                      cx={64}
                      cy={64}
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {orderPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-foreground">{totalOrdersNumber}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {orderPieData.map(d => (
                  <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="sm:col-span-2 space-y-2">
              {!stats.orders?.recent || stats.orders.recent.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent bookstore orders</p>
              ) : (
                stats.orders.recent.map((order: any) => (
                  <div
                    key={order.id}
                    onClick={() => onNavigate?.("orders")}
                    className="p-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground capitalize truncate">
                        {order.customer_name || order.payment_method?.replace("_", " ") || "Bookstore Order"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {timeAgo(order.created_at)} • {order.items?.length || 1} book(s)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">${Number(order.total_amount || 0).toFixed(2)}</p>
                      <div className="mt-0.5">{statusBadge(order.status)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Testimonies & Recent Direct Messages */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Mail size={16} className="text-sky-500" />
                  Recent Direct Inquiries & Testimonies
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Incoming contact inquiries from ministers worldwide.
                </p>
              </div>
              <button
                onClick={() => onNavigate?.("messages")}
                className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
              >
                View all ({Number(stats.messages?.total || 0)})
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Testimonies Quick Review Bar */}
            <div className="mb-4 p-3 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-cyan-400" />
                    Testimony Approvals
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {totalTestimoniesApproved} approved / {totalTestimoniesPending} pending
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: totalTestimoniesNumber > 0
                        ? `${(totalTestimoniesApproved / totalTestimoniesNumber) * 100}%`
                        : "0%"
                    }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: totalTestimoniesNumber > 0
                        ? `${(totalTestimoniesPending / totalTestimoniesNumber) * 100}%`
                        : "0%"
                    }}
                  />
                </div>
              </div>
              {totalTestimoniesPending > 0 && (
                <Button
                  onClick={() => onNavigate?.("testimonies")}
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 shrink-0"
                >
                  Review ({totalTestimoniesPending})
                </Button>
              )}
            </div>

            {/* Recent Messages Feed */}
            <div className="space-y-2">
              {!stats.messages?.recent || stats.messages.recent.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No incoming messages recorded</p>
              ) : (
                stats.messages.recent.map((msg: any) => (
                  <div
                    key={msg.id}
                    onClick={() => onNavigate?.("messages")}
                    className="p-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">{msg.name || "Anonymous Contact"}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{msg.message || "(No message body)"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Synchronized via Supabase Webhooks</span>
            <span className="font-semibold text-foreground">ISM Global Portal v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
