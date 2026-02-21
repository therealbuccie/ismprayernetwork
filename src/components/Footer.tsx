import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-serif text-lg font-bold">Prayer Network</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connecting believers worldwide through the power of prayer.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Platform</h4>
          <div className="flex flex-col gap-2">
            <Link to="/prayer-requests" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prayer Requests</Link>
            <Link to="/groups" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prayer Groups</Link>
            <Link to="/testimonies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonies</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Community</h4>
          <div className="flex flex-col gap-2">
            <Link to="/prayer-room" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prayer Room</Link>
            <Link to="/prayer-points" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prayer Points</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Legal</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ISM Ministers Prayer Network. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Built with <Heart size={12} className="text-accent" /> for the global prayer community
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
