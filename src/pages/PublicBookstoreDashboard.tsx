import { useState, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Tags } from "lucide-react";

const BooksManager = lazy(() =>
  import("@/components/dashboard/BooksManager").then((m) => ({ default: m.BooksManager }))
);
const CategoriesManager = lazy(() =>
  import("@/components/dashboard/CategoriesManager").then((m) => ({ default: m.CategoriesManager }))
);

type Tab = "books" | "categories";

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

const PublicBookstoreDashboard = () => {
  const [tab, setTab] = useState<Tab>("books");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "books", label: "Books", icon: <BookOpen size={16} /> },
    { id: "categories", label: "Categories", icon: <Tags size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="text-sm font-semibold text-foreground">📚 Bookstore Dashboard</span>
          <nav className="flex gap-1 ml-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <Suspense fallback={<TabSkeleton />}>
          {tab === "books" && <BooksManager />}
          {tab === "categories" && <CategoriesManager />}
        </Suspense>
      </main>
    </div>
  );
};

export default PublicBookstoreDashboard;
