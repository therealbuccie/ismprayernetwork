import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, Tv, Heart, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroButton } from "./HeroButton";
import { useAuth } from "@/hooks/useAuth";
import GoogleTranslate from "./GoogleTranslate";
import logo from "@/assets/logo.png";

const prayerItems = [
  { label: "Prayer Requests", href: "/prayer-requests" },
  { label: "Prayer Groups", href: "/groups" },
  { label: "Prayer Room", href: "/prayer-room" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [mobilePrayerOpen, setMobilePrayerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPrayerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass =
    "text-sm font-medium text-foreground/90 hover:text-accent transition-colors duration-200 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="ISM Ministers Prayer Network" className="h-10 w-10 object-contain" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={linkClass}>Home</Link>

          {/* Prayers Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setPrayerOpen(!prayerOpen)}
              className={`${linkClass} flex items-center gap-1 cursor-pointer`}
            >
              Prayers
              <ChevronDown size={14} className={`transition-transform duration-200 ${prayerOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {prayerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-border bg-popover shadow-lg z-[100] overflow-hidden"
                >
                  {prayerItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setPrayerOpen(false)}
                      className="block px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/bookstore" className={linkClass}>Bookstore</Link>
          <Link to="/testimonies" className={linkClass}>Testimonies</Link>
          <Link to="/live-tv" className={`${linkClass} flex items-center gap-1`}>
            <Tv size={14} /> LiveTV
          </Link>
          <Link to="/contact" className={linkClass}>Contact</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <GoogleTranslate />
          {isAdmin && (
            <Link to="/dashboard">
              <HeroButton variant="outline" size="sm" className="text-foreground border-border hover:bg-muted gap-1.5">
                <LayoutDashboard size={14} /> Dashboard
              </HeroButton>
            </Link>
          )}
          <Link to="/partner">
            <HeroButton variant="gold" size="sm" className="gap-1.5">
              <Heart size={14} /> Partner
            </HeroButton>
          </Link>
          {user ? (
            <div onClick={signOut} className="cursor-pointer">
              <HeroButton variant="outline" size="sm" className="text-foreground border-border hover:bg-muted gap-1.5">
                <LogOut size={14} /> Sign Out
              </HeroButton>
            </div>
          ) : (
            <Link to="/auth">
              <HeroButton variant="outline" size="sm" className="text-foreground border-border hover:bg-muted">
                Sign In
              </HeroButton>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card border-t border-border/50 overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Home
              </Link>

              {/* Mobile Prayers Accordion */}
              <button
                onClick={() => setMobilePrayerOpen(!mobilePrayerOpen)}
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                Prayers
                <ChevronDown size={14} className={`transition-transform duration-200 ${mobilePrayerOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {mobilePrayerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-4"
                  >
                    {prayerItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Link to="/bookstore" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Bookstore
              </Link>
              <Link to="/testimonies" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Testimonies
              </Link>
              <Link to="/live-tv" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                <Tv size={14} /> LiveTV
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Contact
              </Link>

              {isAdmin && (
                <Link to="/dashboard" className="text-sm text-accent hover:text-accent/80 py-2 transition-colors flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              )}

              <div className="pt-2 pb-2 md:hidden">
                <GoogleTranslate />
              </div>
              <div className="flex gap-2 pt-2">
                <Link to="/partner" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <HeroButton variant="gold" size="sm" className="w-full gap-1.5">
                    <Heart size={14} /> Partner
                  </HeroButton>
                </Link>
                {user ? (
                  <div className="flex-1 cursor-pointer" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <HeroButton variant="outline" size="sm" className="w-full text-foreground border-border">
                      Sign Out
                    </HeroButton>
                  </div>
                ) : (
                  <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <HeroButton variant="outline" size="sm" className="w-full text-foreground border-border">
                      Sign In
                    </HeroButton>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
