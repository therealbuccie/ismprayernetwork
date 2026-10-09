import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, dashboardAdminCall, adminQuery } from "@/hooks/useBookstoreAdmin";
import {
  BookOpen, Tag, Users, Mail, MessageSquare, CalendarDays, Newspaper,
  HandHeart, UsersRound, ShoppingBag, ClipboardList, TrendingUp, DollarSign,
  Clock, CheckCircle, XCircle, ArrowUpRight, Flame, Download, Database,
  ClipboardCheck, Bell, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

  const { data: liveDatabaseCount } = useQuery({
    queryKey: ["dashboard-database-count", isPublic],
    queryFn: async () => {
      if (isPublic) {
        const meta = await dashboardAdminCall("database_contacts_meta") as { total?: number };
        return meta.total ?? 0;
      }
      const { count, error } = await supabase.from("contacts").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: participationCount = 0 } = useQuery({
    queryKey: ["dashboard-program-participation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_engagements")
        .select("email, opened_at, clicked_at")
        .or("opened_at.not.is.null,clicked_at.not.is.null")
        .limit(20000);
      if (error) return 0;
      return new Set((data || []).map((r: any) => r.email)).size;
    },
  });



  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (isPublic) {
        return dashboardAdminCall("dashboard_stats", {});
      }

      // Authenticated admin path
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
        supabase.from("purchases").select("*, books(title)"),
        supabase.from("announcements").select("id, is_active, archived"),
        supabase.from("prayer_reports").select("id, status, attendance, created_at, minister_name, church, prayer_date"),
        supabase.from("prayer_points").select("id, archived, is_active"),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
      ]);

      return {
        counts: {
          books: books.count ?? 0,
          categories: categories.count ?? 0,
          users: profiles.count ?? 0,
          programs: programs.count ?? 0,
          events: events.count ?? 0,
          subscribers: subscribers.count ?? 0,
          prayerGroups: prayerGroups.count ?? 0,
          contacts: contacts.count ?? 0,
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
          totalRevenue: orders.data?.filter(o => o.status === "approved").reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0,
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
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.counts.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", tab: "users" },
    { label: "Database Records", value: (liveDatabaseCount ?? stats.counts.contacts ?? 0).toLocaleString(), icon: Database, color: "text-indigo-500", bg: "bg-indigo-500/10", tab: "database" },
    { label: "Total Books", value: stats.counts.books, icon: BookOpen, color: "text-accent", bg: "bg-accent/10", tab: "books" },
    { label: "Revenue", value: `$${stats.orders.totalRevenue.toFixed(0)}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", tab: "bookstore-analytics" },
    { label: "Orders", value: stats.orders.total, icon: ShoppingBag, color: "text-violet-500", bg: "bg-violet-500/10", tab: "orders" },
    { label: "Subscribers", value: stats.counts.subscribers, icon: Newspaper, color: "text-pink-500", bg: "bg-pink-500/10", tab: "newsletter" },
    { label: "Prayer Requests", value: stats.prayerRequests.total, icon: HandHeart, color: "text-orange-500", bg: "bg-orange-500/10", tab: "prayer-requests" },
    { label: "Testimonies", value: stats.testimonies.total, icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10", tab: "testimonies" },
    { label: "Prayer Groups", value: stats.counts.prayerGroups, icon: UsersRound, color: "text-teal-500", bg: "bg-teal-500/10", tab: "prayer-groups" },
    { label: "Prayer Points", value: stats.prayerPoints?.total ?? 0, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", tab: "prayer-points" },
    { label: "Reports", value: stats.reports?.total ?? 0, icon: ClipboardCheck, color: "text-sky-500", bg: "bg-sky-500/10", tab: "reports" },
    { label: "Announcements", value: stats.announcements?.total ?? 0, icon: Bell, color: "text-rose-500", bg: "bg-rose-500/10", tab: "announcements" },
    { label: "Program Participation", value: participationCount, icon: Activity, color: "text-lime-500", bg: "bg-lime-500/10", tab: "program-tracker" },
  ];

  const pendingItems = [
    stats.orders.pending > 0 && { label: "Pending Orders", count: stats.orders.pending, color: "bg-yellow-500/20 text-yellow-600", tab: "orders" },
    stats.testimonies.pending > 0 && { label: "Pending Testimonies", count: stats.testimonies.pending, color: "bg-orange-500/20 text-orange-600", tab: "testimonies" },
    (stats.reports?.pending ?? 0) > 0 && { label: "Pending Reports", count: stats.reports!.pending, color: "bg-sky-500/20 text-sky-600", tab: "reports" },
  ].filter(Boolean) as { label: string; count: number; color: string; tab: string }[];

  const orderPieData = [
    { name: "Approved", value: stats.orders.approved, color: "hsl(142, 71%, 45%)" },
    { name: "Pending", value: stats.orders.pending, color: "hsl(48, 96%, 53%)" },
    { name: "Rejected", value: stats.orders.rejected, color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  const statusColor = (s: string) => {
    if (s === "approved") return "text-emerald-500";
    if (s === "rejected") return "text-destructive";
    return "text-yellow-500";
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const exportableTables = [
    "books", "categories", "profiles", "testimonies", "programs", "events",
    "contact_messages", "newsletter_subscribers", "prayer_requests", "prayer_groups",
    "purchase_orders", "purchases", "combo_packs", "campaigns", "prayer_points",
    "contacts", "announcements", "prayer_reports",
  ];

  const exportAllAsCSV = async () => {
    try {
      toast.info("Exporting database...");
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
      a.download = `database-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform analytics and management at a glance</p>
        </div>
        <Button onClick={exportAllAsCSV} variant="outline" size="sm" className="gap-2">
          <Download size={16} />
          Export Database
        </Button>
      </div>

      {/* Pending Alerts */}
      {pendingItems.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {pendingItems.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate?.(item.tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 ${item.color}`}
            >
              <Clock size={14} />
              {item.count} {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onNavigate?.(s.tab)}
            className="group text-left rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </button>
        ))}
      </div>


      {/* Middle Row - Orders Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Order Status</h3>
          {stats.orders.total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={orderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-3">
            {orderPieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Prayers Offered</span>
              <span className="text-lg font-bold text-foreground">{stats.prayerRequests.totalPrayers.toLocaleString()}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Book Access Granted</span>
              <span className="text-lg font-bold text-foreground">{stats.purchases.total}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contact Messages</span>
              <span className="text-lg font-bold text-foreground">{stats.messages.total}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Categories</span>
              <span className="text-lg font-bold text-foreground">{stats.counts.categories}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Programs</span>
              <span className="text-lg font-bold text-foreground">{stats.counts.programs}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Events</span>
              <span className="text-lg font-bold text-foreground">{stats.counts.events}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Report Attendance</span>
              <span className="text-lg font-bold text-foreground">{(stats.reports?.totalAttendance ?? 0).toLocaleString()}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Archived Items</span>
              <span className="text-lg font-bold text-foreground">{(stats.prayerPoints?.archived ?? 0) + (stats.announcements?.archived ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Testimonies Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Testimonies</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Approved</span>
                  <span className="font-medium text-foreground">{stats.testimonies.approved}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: stats.testimonies.total > 0 ? `${(stats.testimonies.approved / stats.testimonies.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Pending Review</span>
                  <span className="font-medium text-foreground">{stats.testimonies.pending}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: stats.testimonies.total > 0 ? `${(stats.testimonies.pending / stats.testimonies.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.testimonies.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Testimonies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList size={16} /> Recent Orders
            </h3>
            <Badge variant="outline" className="text-xs">{stats.orders.total} total</Badge>
          </div>
          {stats.orders.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.orders.recent.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {order.payment_method.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(order.created_at)} · {order.items?.length || 0} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${order.total_amount?.toFixed(2)}</p>
                    <p className={`text-xs font-medium capitalize ${statusColor(order.status)}`}>{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail size={16} /> Recent Messages
            </h3>
            <Badge variant="outline" className="text-xs">{stats.messages.total} total</Badge>
          </div>
          {stats.messages.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No messages yet</p>
          ) : (
            <div className="space-y-3">
              {stats.messages.recent.map((msg: any) => (
                <div key={msg.id} className="py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{msg.name}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
