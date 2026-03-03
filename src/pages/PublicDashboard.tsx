import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, lazy, Suspense } from "react";
import type { DashboardTab } from "./Dashboard";
import { BookstorePinGate } from "@/components/dashboard/BookstorePinGate";
import { storePin } from "@/hooks/useBookstoreAdmin";

const DashboardHome = lazy(() => import("@/components/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const BooksManager = lazy(() => import("@/components/dashboard/BooksManager").then(m => ({ default: m.BooksManager })));
const CategoriesManager = lazy(() => import("@/components/dashboard/CategoriesManager").then(m => ({ default: m.CategoriesManager })));
const UsersManager = lazy(() => import("@/components/dashboard/UsersManager").then(m => ({ default: m.UsersManager })));
const ContactMessagesManager = lazy(() => import("@/components/dashboard/ContactMessagesManager").then(m => ({ default: m.ContactMessagesManager })));
const TestimoniesManager = lazy(() => import("@/components/dashboard/TestimoniesManager").then(m => ({ default: m.TestimoniesManager })));
const EventsManager = lazy(() => import("@/components/dashboard/EventsManager").then(m => ({ default: m.EventsManager })));
const ProgramsManager = lazy(() => import("@/components/dashboard/ProgramsManager").then(m => ({ default: m.ProgramsManager })));
const NewsletterManager = lazy(() => import("@/components/dashboard/NewsletterManager").then(m => ({ default: m.NewsletterManager })));
const PrayerRequestsManager = lazy(() => import("@/components/dashboard/PrayerRequestsManager").then(m => ({ default: m.PrayerRequestsManager })));
const PrayerGroupsManager = lazy(() => import("@/components/dashboard/PrayerGroupsManager").then(m => ({ default: m.PrayerGroupsManager })));
const OrdersManager = lazy(() => import("@/components/dashboard/OrdersManager").then(m => ({ default: m.OrdersManager })));
const PurchasesManager = lazy(() => import("@/components/dashboard/PurchasesManager").then(m => ({ default: m.PurchasesManager })));
const SiteSettingsManager = lazy(() => import("@/components/dashboard/SiteSettingsManager").then(m => ({ default: m.SiteSettingsManager })));
const CampaignsManager = lazy(() => import("@/components/dashboard/CampaignsManager").then(m => ({ default: m.CampaignsManager })));
const LiveTVManager = lazy(() => import("@/components/dashboard/LiveTVManager").then(m => ({ default: m.LiveTVManager })));
const PaymentSettingsManager = lazy(() => import("@/components/dashboard/PaymentSettingsManager").then(m => ({ default: m.PaymentSettingsManager })));

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

const PublicDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("dashboard_unlocked") === "1");

  if (!unlocked) {
    return (
      <BookstorePinGate
        onUnlock={() => {
          sessionStorage.setItem("dashboard_unlocked", "1");
          storePin("2323", "dashboard_pin");
          setUnlocked(true);
        }}
        title="Admin Dashboard"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} isSuperAdmin={true} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === "home" && <DashboardHome />}
            {activeTab === "books" && <BooksManager />}
            {activeTab === "categories" && <CategoriesManager />}
            {activeTab === "users" && <UsersManager />}
            {activeTab === "messages" && <ContactMessagesManager />}
            {activeTab === "testimonies" && <TestimoniesManager />}
            {activeTab === "events" && <EventsManager />}
            {activeTab === "programs" && <ProgramsManager />}
            {activeTab === "newsletter" && <NewsletterManager />}
            {activeTab === "prayer-requests" && <PrayerRequestsManager />}
            {activeTab === "prayer-groups" && <PrayerGroupsManager />}
            {activeTab === "orders" && <OrdersManager />}
            {activeTab === "purchases" && <PurchasesManager />}
            {activeTab === "campaigns" && <CampaignsManager />}
            {activeTab === "live-tv" && <LiveTVManager />}
            {activeTab === "payment-settings" && <PaymentSettingsManager />}
            {activeTab === "settings" && <SiteSettingsManager />}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;
