import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery } from "@/hooks/useBookstoreAdmin";
import {
  BookOpen, ShoppingBag, DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  Package, Users, BarChart3, ArrowUpRight, CreditCard, Globe, Layers, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend
} from "recharts";

interface BookSalesData {
  book_id: string;
  title: string;
  cover_image_url: string | null;
  total_orders: number;
  total_units: number;
  total_revenue: number;
  digital_units: number;
  physical_units: number;
}

interface AnalyticsData {
  overview: {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    rejectedOrders: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalBooks: number;
    totalPurchasesGranted: number;
    avgOrderValue: number;
    totalItemsSold: number;
  };
  paymentBreakdown: { method: string; count: number; revenue: number }[];
  currencyBreakdown: { currency: string; count: number; revenue: number }[];
  bookSales: BookSalesData[];
  ordersByDay: { date: string; orders: number; revenue: number }[];
  recentOrders: any[];
  topBuyers: { user_id: string; email: string; orders: number; spent: number }[];
  stockAlerts: { id: string; title: string; stock: number }[];
}

const CHART_COLORS = [
  "hsl(142, 71%, 45%)", "hsl(48, 96%, 53%)", "hsl(0, 84%, 60%)",
  "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(25, 95%, 53%)"
];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusColor = (s: string) =>
  s === "approved" ? "text-emerald-500" : s === "rejected" ? "text-destructive" : "text-yellow-500";

export function BookstoreAnalytics() {
  const isPublic = isPublicDashboard();

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["bookstore-analytics"],
    queryFn: async () => {
      const [ordersRes, booksRes, purchasesRes, profilesRes] = await Promise.all([
        isPublic
          ? adminQuery("purchase_orders", "*")
          : supabase.from("purchase_orders").select("*").then(r => r.data ?? []),
        isPublic
          ? adminQuery("books", "*")
          : supabase.from("books").select("*").then(r => r.data ?? []),
        isPublic
          ? adminQuery("purchases", "*")
          : supabase.from("purchases").select("*, books(title)").then(r => r.data ?? []),
        isPublic
          ? adminQuery("profiles", "user_id, email, full_name")
          : supabase.from("profiles").select("user_id, email, full_name").then(r => r.data ?? []),
      ]);

      const orders = (ordersRes || []) as any[];
      const books = (booksRes || []) as any[];
      const purchases = (purchasesRes || []) as any[];
      const profiles = (profilesRes || []) as any[];

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

      // Overview
      const approved = orders.filter(o => o.status === "approved");
      const pending = orders.filter(o => o.status === "pending");
      const rejected = orders.filter(o => o.status === "rejected");
      const totalRevenue = approved.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const pendingRevenue = pending.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const totalItemsSold = approved.reduce((s: number, o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return s + items.reduce((is: number, i: any) => is + (i.quantity || 1), 0);
      }, 0);

      // Payment method breakdown
      const paymentMap = new Map<string, { count: number; revenue: number }>();
      orders.forEach((o: any) => {
        const m = o.payment_method || "unknown";
        const existing = paymentMap.get(m) || { count: 0, revenue: 0 };
        existing.count++;
        if (o.status === "approved") existing.revenue += o.total_amount || 0;
        paymentMap.set(m, existing);
      });
      const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, d]) => ({
        method: method.replace("_", " "),
        count: d.count,
        revenue: d.revenue,
      }));

      // Currency breakdown
      const currencyMap = new Map<string, { count: number; revenue: number }>();
      approved.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          const cur = (item.currency || "usd").toUpperCase();
          const existing = currencyMap.get(cur) || { count: 0, revenue: 0 };
          existing.count += item.quantity || 1;
          existing.revenue += (item.price || 0) * (item.quantity || 1);
          currencyMap.set(cur, existing);
        });
      });
      const currencyBreakdown = Array.from(currencyMap.entries()).map(([currency, d]) => ({
        currency,
        count: d.count,
        revenue: d.revenue,
      }));

      // Book sales
      const bookSalesMap = new Map<string, BookSalesData>();
      approved.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          const bid = item.book_id || "unknown";
          const existing = bookSalesMap.get(bid) || {
            book_id: bid,
            title: item.title || "Unknown",
            cover_image_url: null,
            total_orders: 0,
            total_units: 0,
            total_revenue: 0,
            digital_units: 0,
            physical_units: 0,
          };
          existing.total_orders++;
          existing.total_units += item.quantity || 1;
          existing.total_revenue += (item.price || 0) * (item.quantity || 1);
          if (item.format === "digital") existing.digital_units += item.quantity || 1;
          else existing.physical_units += item.quantity || 1;
          bookSalesMap.set(bid, existing);
        });
      });
      // Add cover images from books data
      books.forEach((b: any) => {
        const existing = bookSalesMap.get(b.id);
        if (existing) existing.cover_image_url = b.cover_image_url;
      });
      const bookSales = Array.from(bookSalesMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);

      // Orders by day (last 30 days)
      const dayMap = new Map<string, { orders: number; revenue: number }>();
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().split("T")[0], { orders: 0, revenue: 0 });
      }
      orders.forEach((o: any) => {
        const day = o.created_at?.split("T")[0];
        if (day && dayMap.has(day)) {
          const existing = dayMap.get(day)!;
          existing.orders++;
          if (o.status === "approved") existing.revenue += o.total_amount || 0;
        }
      });
      const ordersByDay = Array.from(dayMap.entries()).map(([date, d]) => ({
        date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
        orders: d.orders,
        revenue: d.revenue,
      }));

      // Recent orders
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((o: any) => {
          const prof = profileMap.get(o.user_id);
          return {
            ...o,
            buyer_email: prof?.email || o.user_id,
            buyer_name: prof?.full_name || "Unknown",
            item_count: Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0,
          };
        });

      // Top buyers
      const buyerMap = new Map<string, { orders: number; spent: number }>();
      approved.forEach((o: any) => {
        const existing = buyerMap.get(o.user_id) || { orders: 0, spent: 0 };
        existing.orders++;
        existing.spent += o.total_amount || 0;
        buyerMap.set(o.user_id, existing);
      });
      const topBuyers = Array.from(buyerMap.entries())
        .map(([user_id, d]) => ({
          user_id,
          email: profileMap.get(user_id)?.email || user_id.slice(0, 8),
          orders: d.orders,
          spent: d.spent,
        }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

      // Stock alerts (books with stock <= 5)
      const stockAlerts = books
        .filter((b: any) => b.is_physical && b.stock <= 5)
        .map((b: any) => ({ id: b.id, title: b.title, stock: b.stock }))
        .sort((a: any, b: any) => a.stock - b.stock);

      return {
        overview: {
          totalOrders: orders.length,
          pendingOrders: pending.length,
          approvedOrders: approved.length,
          rejectedOrders: rejected.length,
          totalRevenue,
          pendingRevenue,
          totalBooks: books.length,
          totalPurchasesGranted: purchases.length,
          avgOrderValue: approved.length > 0 ? totalRevenue / approved.length : 0,
          totalItemsSold,
        },
        paymentBreakdown,
        currencyBreakdown,
        bookSales,
        ordersByDay,
        recentOrders,
        topBuyers,
        stockAlerts,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-muted rounded-xl animate-pulse" />
          <div className="h-72 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { overview } = data;

  const statCards = [
    { label: "Total Orders", value: overview.totalOrders, icon: ShoppingBag, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Approved Revenue", value: `$${overview.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pending Revenue", value: `$${overview.pendingRevenue.toFixed(2)}`, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Avg Order Value", value: `$${overview.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pending Orders", value: overview.pendingOrders, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Approved Orders", value: overview.approvedOrders, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Items Sold", value: overview.totalItemsSold, icon: Package, color: "text-accent", bg: "bg-accent/10" },
    { label: "Access Granted", value: overview.totalPurchasesGranted, icon: Eye, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  const orderPieData = [
    { name: "Approved", value: overview.approvedOrders, color: "hsl(142, 71%, 45%)" },
    { name: "Pending", value: overview.pendingOrders, color: "hsl(48, 96%, 53%)" },
    { name: "Rejected", value: overview.rejectedOrders, color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-accent" /> Bookstore Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comprehensive insights into purchases, orders, payments, and inventory
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Over Time */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Orders & Revenue (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="orders" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.1} name="Orders" />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.1} name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Order Status</h3>
          {overview.totalOrders === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {orderPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {orderPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment & Currency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> Payment Methods
          </h3>
          {data.paymentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payment data</p>
          ) : (
            <div className="space-y-3">
              {data.paymentBreakdown.map((pm, i) => (
                <div key={pm.method} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm font-medium text-foreground capitalize">{pm.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{pm.count} orders</p>
                    <p className="text-xs text-muted-foreground">${pm.revenue.toFixed(2)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currency Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" /> Currency Breakdown
          </h3>
          {data.currencyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No currency data</p>
          ) : (
            <div className="space-y-3">
              {data.currencyBreakdown.map((cb, i) => (
                <div key={cb.currency} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm font-bold text-foreground">{cb.currency}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{cb.count} items</p>
                    <p className="text-xs text-muted-foreground">{cb.revenue.toFixed(2)} total</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Sales Leaderboard */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" /> Book Sales Leaderboard
        </h3>
        {data.bookSales.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No sales data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs text-muted-foreground font-medium">#</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium">Book</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-center">Orders</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-center">Units</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-center">Digital</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-center">Physical</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.bookSales.map((b, i) => (
                  <tr key={b.book_id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {b.cover_image_url && (
                          <img src={b.cover_image_url} alt="" className="w-8 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium text-foreground">{b.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-foreground">{b.total_orders}</td>
                    <td className="py-3 text-center text-foreground font-semibold">{b.total_units}</td>
                    <td className="py-3 text-center text-blue-500">{b.digital_units}</td>
                    <td className="py-3 text-center text-orange-500">{b.physical_units}</td>
                    <td className="py-3 text-right font-bold text-foreground">${b.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Row: Recent Orders, Top Buyers, Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" /> Recent Orders
            </h3>
            <Badge variant="outline" className="text-xs">{overview.totalOrders} total</Badge>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-xs text-muted-foreground font-medium">Buyer</th>
                    <th className="pb-2 text-xs text-muted-foreground font-medium">Method</th>
                    <th className="pb-2 text-xs text-muted-foreground font-medium text-center">Items</th>
                    <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Amount</th>
                    <th className="pb-2 text-xs text-muted-foreground font-medium text-center">Status</th>
                    <th className="pb-2 text-xs text-muted-foreground font-medium text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5">
                        <p className="font-medium text-foreground text-xs">{o.buyer_name}</p>
                        <p className="text-[10px] text-muted-foreground">{o.buyer_email}</p>
                      </td>
                      <td className="py-2.5 text-xs text-foreground capitalize">{o.payment_method?.replace("_", " ")}</td>
                      <td className="py-2.5 text-xs text-center text-foreground">{o.item_count}</td>
                      <td className="py-2.5 text-xs text-right font-bold text-foreground">${o.total_amount?.toFixed(2)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-semibold capitalize ${statusColor(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="py-2.5 text-xs text-right text-muted-foreground">{timeAgo(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Buyers + Stock Alerts */}
        <div className="space-y-6">
          {/* Top Buyers */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Top Buyers
            </h3>
            {data.topBuyers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No buyer data</p>
            ) : (
              <div className="space-y-2">
                {data.topBuyers.map((b, i) => (
                  <div key={b.user_id} className="flex items-center justify-between py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-foreground truncate">{b.email}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-foreground">${b.spent.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{b.orders} order(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock Alerts */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-destructive" /> Low Stock Alerts
            </h3>
            {data.stockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All stocked up! ✅</p>
            ) : (
              <div className="space-y-2">
                {data.stockAlerts.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1.5">
                    <span className="text-foreground truncate">{b.title}</span>
                    <Badge variant={b.stock === 0 ? "destructive" : "outline"} className="text-[10px] shrink-0 ml-2">
                      {b.stock === 0 ? "OUT OF STOCK" : `${b.stock} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
