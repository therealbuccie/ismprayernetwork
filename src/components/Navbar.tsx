import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, Tv, Heart, LayoutDashboard, LogOut, MoreHorizontal, Globe } from "lucide-react";
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

const moreItems = [
  { label: "Testimonies", href: "/testimonies" },
  { label: "Events", href: "/events" },
  { label: "Programs", href: "/programs" },
  { label: "Our Impact", href: "/our-impact" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [mobilePrayerOpen, setMobilePrayerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPrayerOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (translateRef.current && !translateRef.current.contains(e.target as Node)) {
        setTranslateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass =
    "text-sm font-medium text-foreground/90 hover:text-accent transition-colors duration-200 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left";

  const dropdownMenuClass = "absolute top-full left-0 mt-2 w-48 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg z-[100] overflow-hidden py-1";
  const dropdownItemClass = "block px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent/10 hover:text-accent transition-colors";

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
                  className={dropdownMenuClass}
                >
                  {prayerItems.map((item) => (
                    <Link key={item.href} to={item.href} onClick={() => setPrayerOpen(false)} className={dropdownItemClass}>
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/bookstore" className={linkClass}>Bookstore</Link>
          <Link to="/contact" className={linkClass}>Contact</Link>
          <Link to="/live-tv" className={`${linkClass} flex items-center gap-1`}>
            <Tv size={14} /> LiveTV
          </Link>

          {/* More Dropdown (three dots) */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`${linkClass} flex items-center gap-1 cursor-pointer`}
              title="More"
            >
              <MoreHorizontal size={20} className={`transition-transform duration-200 ${moreOpen ? "text-accent" : ""}`} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className={dropdownMenuClass}
                >
                  {moreItems.map((item) => (
                    <Link key={item.href} to={item.href} onClick={() => setMoreOpen(false)} className={dropdownItemClass}>
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Globe translate button */}
          <div ref={translateRef} className="relative">
            <button
              onClick={() => setTranslateOpen(!translateOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${translateOpen ? "text-accent bg-accent/10" : "text-foreground/70 hover:text-accent hover:bg-accent/10"}`}
              title="Translate"
            >
              <Globe size={18} />
            </button>
            <div
              className={`absolute top-full right-0 mt-2 rounded-xl border border-border/60 bg-popover backdrop-blur-xl shadow-lg z-[100] p-3 min-w-[220px] transition-all duration-200 ${translateOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">🌐 Translate Page</p>
              <GoogleTranslate />
            </div>
          </div>

          {isAdmin && (
            <Link to="/admin">
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
              <HeroButton variant="outline" size="sm" onClick={() => signOut()} className="text-foreground border-border hover:bg-muted gap-1.5 cursor-pointer">
                <LogOut size={14} /> Sign Out
              </HeroButton>
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pl-4">
                    {prayerItems.map((item) => (
                      <Link key={item.href} to={item.href} className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors" onClick={() => setMobileOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Link to="/bookstore" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Bookstore
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors" onClick={() => setMobileOpen(false)}>
                Contact
              </Link>
              <Link to="/live-tv" className="text-sm text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                <Tv size={14} /> LiveTV
              </Link>

              {/* Mobile More Accordion */}
              <button
                onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <span className="flex items-center gap-1.5"><MoreHorizontal size={14} /> More</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${mobileMoreOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {mobileMoreOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pl-4">
                    {moreItems.map((item) => (
                      <Link key={item.href} to={item.href} className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors" onClick={() => setMobileOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {isAdmin && (
                <Link to="/admin" className="text-sm text-accent hover:text-accent/80 py-2 transition-colors flex items-center gap-1" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              )}

              <div className="pt-2 pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Globe size={14} /> Translate
                </div>
                <GoogleTranslate />
              </div>

              <div className="flex gap-2 pt-2">
                <Link to="/partner" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <HeroButton variant="gold" size="sm" className="w-full gap-1.5">
                    <Heart size={14} /> Partner
                  </HeroButton>
                </Link>
                {user ? (
                  <div className="flex-1">
                    <HeroButton variant="outline" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="w-full text-foreground border-border cursor-pointer">
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
