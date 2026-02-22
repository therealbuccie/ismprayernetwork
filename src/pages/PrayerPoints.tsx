import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Flame, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

const prayerPoints = [
  {
    category: "Healing Streams",
    points: [
      {
        title: "PRAY CONCERNING TELEVISION AND RADIO BROADCAST",
        scripture: 'Romans 10:18 NKJV - "But I say, have they not heard? Yes indeed: \'Their sound has gone out to all the earth, and their words to the ends of the world\'"',
        body: "Thank God for the global broadcast of the Healing Streams Live Healing Services with Pastor Chris through television and radio networks around the world. Pray that every viewer and listener receives miracles, salvation, and restoration through every transmission.",
      },
      {
        title: "PRAY FOR MIRACLES AND HEALING",
        scripture: 'Mark 16:18 - "They shall lay hands on the sick, and they shall recover."',
        body: "Pray that as the word goes forth in the Healing Streams services, signs and wonders follow. Pray for creative miracles, divine healing, and total restoration for every participant.",
      },
    ],
  },
  {
    category: "Nations & Leaders",
    points: [
      {
        title: "PRAY FOR LEADERS OF NATIONS",
        scripture: '1 Timothy 2:1-2 - "I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men; for kings, and for all that are in authority."',
        body: "Pray for world leaders to make godly decisions. Pray for peace, justice, and righteousness in every nation. Pray against corruption and ungodly policies.",
      },
      {
        title: "PRAY FOR OPEN DOORS IN RESTRICTED NATIONS",
        scripture: 'Revelation 3:8 - "I have set before thee an open door, and no man can shut it."',
        body: "Pray for the gospel to penetrate nations where Christianity is restricted. Pray for boldness for ministers and believers in such regions.",
      },
    ],
  },
  {
    category: "Ministers & Ministry",
    points: [
      {
        title: "PRAY FOR MINISTERS OF THE GOSPEL",
        scripture: 'Ephesians 6:19 - "And for me, that utterance may be given unto me, that I may open my mouth boldly, to make known the mystery of the gospel."',
        body: "Pray for every minister of the gospel to receive divine utterance and boldness. Pray for protection, provision, and increased anointing for all ISM ministers worldwide.",
      },
      {
        title: "PRAY FOR CHURCH GROWTH",
        scripture: 'Acts 2:47 - "And the Lord added to the church daily such as should be saved."',
        body: "Pray for exponential growth in churches and ministries across the world. Pray that the harvest of souls continues unabated.",
      },
    ],
  },
  {
    category: "Personal & Family",
    points: [
      {
        title: "PRAY FOR YOUR FAMILY",
        scripture: 'Joshua 24:15 - "As for me and my house, we will serve the Lord."',
        body: "Pray for salvation, unity, and divine protection over your family. Pray that every member of your household walks in the light of God's word.",
      },
      {
        title: "PRAY FOR SPIRITUAL GROWTH",
        scripture: '2 Peter 3:18 - "But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ."',
        body: "Pray for a deeper personal relationship with the Lord. Pray for wisdom, understanding, and spiritual maturity in your walk with God.",
      },
    ],
  },
];

const PrayerPoints = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(prayerPoints[0].category);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16">
        <div className="hero-gradient py-10 px-4">
          <div className="container mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <BookOpen size={48} className="mx-auto text-accent mb-4" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-2">
                Prayer <span className="gold-gradient">Points</span>
              </h1>
              <p className="text-primary-foreground/70 max-w-xl mx-auto">
                Structured and guided prayer sessions for ministers around the world.
              </p>
              <p className="text-primary-foreground/50 text-sm mt-2 flex items-center justify-center gap-1.5">
                <Calendar size={14} /> {today}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="space-y-4">
          {prayerPoints.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08 }}
              className="glass-card rounded-xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center">
                    <Flame size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base">{cat.category}</h3>
                    <p className="text-xs text-muted-foreground">{cat.points.length} prayer points</p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground transition-transform ${expandedCategory === cat.category ? "rotate-180" : ""}`}
                />
              </button>

              {expandedCategory === cat.category && (
                <div className="px-5 pb-5 space-y-6">
                  {cat.points.map((point, pi) => (
                    <div key={pi} className="border-t border-border/50 pt-4">
                      <h4 className="font-serif font-bold text-sm mb-2 text-foreground leading-snug">{point.title}</h4>
                      <p className="text-xs text-muted-foreground italic mb-3 leading-relaxed border-l-2 border-accent/50 pl-3">
                        {point.scripture}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{point.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrayerPoints;
