import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Users, Lock, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockGroups = [
  { id: 1, name: "Intercessors for Nations", members: 234, isPublic: true, description: "A global prayer group focused on praying for nations and their leaders." },
  { id: 2, name: "Healing Prayer Circle", members: 89, isPublic: true, description: "United in faith for divine healing and restoration." },
  { id: 3, name: "Youth on Fire", members: 156, isPublic: false, description: "Young believers praying fervently for revival and transformation." },
  { id: 4, name: "Marriage Intercessors", members: 67, isPublic: true, description: "Covering marriages and families in prayer." },
  { id: 5, name: "Pastors' Prayer Watch", members: 45, isPublic: false, description: "Ministers standing together in prayer for the church." },
  { id: 6, name: "Marketplace Ministers", members: 112, isPublic: true, description: "Praying for believers in the workplace and business world." },
];

const PrayerGroups = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
            Prayer <span className="gold-gradient">Groups</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find your prayer community. Join existing groups or create your own.
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <Button className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2">
            <Plus size={16} /> Create Group
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGroups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard variant="hover" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    {group.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                    {group.isPublic ? "Public" : "Private"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={12} /> {group.members}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                <Button size="sm" variant="outline" className="w-full">
                  Join Group
                </Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default PrayerGroups;
