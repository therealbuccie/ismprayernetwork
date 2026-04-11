import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCampaigns } from "@/hooks/useCampaigns";

const INITIAL_DELAY = 30_000;
const REPEAT_INTERVAL = 300_000;

interface PopupItem {
  image: string;
  title: string;
  linkUrl: string;
  ctaText: string;
}

const CampaignPopup = () => {
  const { data: campaigns } = useCampaigns();
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Fetch upcoming programs with flyers
  const { data: upcomingPrograms } = useQuery({
    queryKey: ["popup-upcoming-programs"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("programs")
        .select("id, title, image_url, registration_url, event_date")
        .eq("is_upcoming", true)
        .gte("event_date", now)
        .not("image_url", "is", null)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Build unified popup items list
  const popupItems: PopupItem[] = useMemo(() => {
    const items: PopupItem[] = [];

    // Add campaign images
    campaigns?.forEach((c) => {
      c.images.forEach((img) => {
        items.push({ image: img, title: c.title, linkUrl: c.link_url, ctaText: "Tap to view in bookstore →" });
      });
    });

    // Add upcoming program flyers
    upcomingPrograms?.forEach((p: any) => {
      if (p.image_url) {
        items.push({
          image: p.image_url,
          title: p.title,
          linkUrl: p.registration_url || "/programs",
          ctaText: "Tap to register →",
        });
      }
    });

    return items;
  }, [campaigns, upcomingPrograms]);

  const show = useCallback(() => {
    if (popupItems.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * popupItems.length));
      setVisible(true);
    }
  }, [popupItems]);

  useEffect(() => {
    const initialTimer = setTimeout(show, INITIAL_DELAY);
    const interval = setInterval(show, REPEAT_INTERVAL);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [show]);

  if (popupItems.length === 0) return null;

  const current = popupItems[currentIndex % popupItems.length];
  const isExternal = current.linkUrl.startsWith("http");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    if (isExternal) {
      window.open(current.linkUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate(current.linkUrl);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full cursor-pointer"
            onClick={handleClick}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(false); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="rounded-2xl overflow-hidden shadow-2xl ring-2 ring-accent/30">
              <img src={current.image} alt={current.title} className="w-full h-auto object-cover" />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-3 animate-pulse">
              {current.ctaText}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CampaignPopup;
