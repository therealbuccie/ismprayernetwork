import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCampaigns } from "@/hooks/useCampaigns";

const INITIAL_DELAY = 30_000; // 30 seconds
const REPEAT_INTERVAL = 300_000; // 5 minutes

const CampaignPopup = () => {
  const { data: campaigns } = useCampaigns();
  const [visible, setVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();

  const activeCampaign = campaigns?.[0];

  const show = useCallback(() => {
    if (activeCampaign && activeCampaign.images.length > 0) {
      setImageIndex(Math.floor(Math.random() * activeCampaign.images.length));
      setVisible(true);
    }
  }, [activeCampaign]);

  useEffect(() => {
    const initialTimer = setTimeout(show, INITIAL_DELAY);
    const interval = setInterval(show, REPEAT_INTERVAL);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [show]);

  if (!activeCampaign) return null;

  const currentImage = activeCampaign.images[imageIndex];

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
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              navigate(activeCampaign.link_url);
            }}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <div className="rounded-2xl overflow-hidden shadow-2xl ring-2 ring-accent/30">
              <img
                src={currentImage}
                alt={activeCampaign.title}
                className="w-full h-auto object-cover"
              />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-3 animate-pulse">
              Tap to view in bookstore →
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CampaignPopup;
