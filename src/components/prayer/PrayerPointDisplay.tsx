import { useState, useMemo } from "react";
import {
  Flame, BookOpen, Clock, Copy, Check, ChevronDown,
  Sparkles, Share2, ZoomIn, ZoomOut, Bookmark, Quote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface PrayerPointRecord {
  id: string;
  title: string;
  category?: string | null;
  scripture?: string | null;
  body: string;
  sort_order?: number;
}

interface Props {
  prayerPoint?: PrayerPointRecord | null;
  allPrayerPoints?: PrayerPointRecord[];
  onSelectPrayerPoint?: (point: PrayerPointRecord) => void;
  className?: string;
  maxHeight?: string;
}

export interface ParsedSection {
  id: string;
  badge: string;
  timeSlot?: string;
  title: string;
  scriptures: string[];
  declarations: string[];
}

/** Remove invisible Unicode characters and normalize whitespace. */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Check if a line appears to be a scripture reference or verse quote. */
function isScriptureLine(line: string): boolean {
  const l = line.trim();
  if (!l) return false;

  // Patterns matching Bible references and quotes
  const bibleBookPattern = /^(?:\d\s*)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s*\d+[:.]\d+/i;

  if (bibleBookPattern.test(l)) return true;
  if (/\b(?:KJV|NIV|ESV|NKJV|AMP|NLT|TPT|MSG|NRSV)\b/.test(l)) return true;
  if (/^["“'].*["”']$/.test(l) && l.length > 20) return true;
  if (/(?:says|declares|written),?\s*["“']/i.test(l)) return true;

  return false;
}

/** Parse an ISM prayer point body into structured, dignified sections. */
export function parsePrayerPointSections(
  rawBody: string,
  fallbackTitle: string,
  fallbackScripture?: string | null
): ParsedSection[] {
  const clean = sanitizeText(rawBody);
  if (!clean) {
    return [
      {
        id: "section-1",
        badge: "PRAYER POINT",
        title: sanitizeText(fallbackTitle),
        scriptures: fallbackScripture ? [sanitizeText(fallbackScripture)] : [],
        declarations: [],
      },
    ];
  }

  // Split into raw lines
  const rawLines = clean.split(/\r?\n/).map(l => sanitizeText(l)).filter(Boolean);

  // Detect if there are multiple "PRAYER POINT" markers
  const markerRegex = /^PRAYER POINT\s*(\d+)?(?:\s*[-–—:]\s*(.*))?$/i;

  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let sectionIndex = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const markerMatch = line.match(markerRegex);

    if (markerMatch) {
      // Save prior section if present
      if (currentSection) {
        sections.push(currentSection);
      }

      sectionIndex++;
      const pointNum = markerMatch[1] || String(sectionIndex);
      const rest = markerMatch[2] ? sanitizeText(markerMatch[2]) : "";

      // Check if `rest` has a time slot (e.g., "00:00AM TO 10:00 GMT+1")
      let timeSlot: string | undefined;
      let possibleTitle: string | undefined;

      const timeMatch = rest.match(/(\d{1,2}:\d{2}\s*[AP]?M?\s*(?:TO|-|–|—)\s*\d{1,2}:\d{2}\s*[AP]?M?(?:\s*GMT[+\-]?\d+)?)/i);
      if (timeMatch) {
        timeSlot = timeMatch[1].trim();
        const leftover = rest.replace(timeMatch[0], "").replace(/^[-–—:]\s*/, "").trim();
        if (leftover.length > 5) {
          possibleTitle = leftover;
        }
      } else if (rest.length > 5) {
        possibleTitle = rest;
      }

      currentSection = {
        id: `section-${pointNum}`,
        badge: `PRAYER POINT ${pointNum}`,
        timeSlot,
        title: possibleTitle || "",
        scriptures: [],
        declarations: [],
      };
      continue;
    }

    if (!currentSection) {
      // Create first section
      sectionIndex++;
      currentSection = {
        id: `section-${sectionIndex}`,
        badge: `PRAYER POINT ${sectionIndex}`,
        title: sanitizeText(fallbackTitle),
        scriptures: fallbackScripture ? [sanitizeText(fallbackScripture)] : [],
        declarations: [],
      };
    }

    // If section does not yet have a title, and this line looks like a title
    if (!currentSection.title && line.length > 5 && !isScriptureLine(line) && line === line.toUpperCase()) {
      currentSection.title = line;
      continue;
    }

    // Check if scripture
    if (isScriptureLine(line)) {
      currentSection.scriptures.push(line);
      continue;
    }

    // Otherwise it's a declaration / instruction paragraph
    currentSection.declarations.push(line);
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Fallback if no sections parsed cleanly
  if (sections.length === 0) {
    sections.push({
      id: "section-1",
      badge: "PRAYER POINT",
      title: sanitizeText(fallbackTitle),
      scriptures: fallbackScripture ? [sanitizeText(fallbackScripture)] : [],
      declarations: rawLines,
    });
  }

  // Ensure title is present on sections
  sections.forEach((sec, idx) => {
    if (!sec.title) {
      sec.title = idx === 0 ? sanitizeText(fallbackTitle) : `Intercession Focus ${idx + 1}`;
    }
  });

  return sections;
}

export function PrayerPointDisplay({
  prayerPoint,
  allPrayerPoints = [],
  onSelectPrayerPoint,
  className = "",
  maxHeight = "max-h-[68vh]",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  const todaysDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  const parsedSections = useMemo(() => {
    if (!prayerPoint) return [];
    return parsePrayerPointSections(
      prayerPoint.body || "",
      prayerPoint.title || "Daily Intercession Focus",
      prayerPoint.scripture
    );
  }, [prayerPoint]);

  const handleCopy = () => {
    if (!prayerPoint) return;
    const cleanTitle = sanitizeText(prayerPoint.title);
    const cleanScripture = sanitizeText(prayerPoint.scripture || "");
    const cleanBody = sanitizeText(prayerPoint.body || "");

    const textToCopy = [
      `ISM PRAYER NETWORK — TODAY'S PRAYER FOCUS`,
      `${todaysDate}`,
      prayerPoint.category ? `Category: ${sanitizeText(prayerPoint.category)}` : null,
      `\nTITLE: ${cleanTitle}`,
      cleanScripture ? `\nSCRIPTURE:\n${cleanScripture}` : null,
      `\nPRAYER POINTS:\n${cleanBody}`,
      `\nhttps://ismprayernetwork.org/prayer-room`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Prayer point copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const visibleSections = useMemo(() => {
    if (activeTab === "all") return parsedSections;
    return parsedSections.filter(s => s.id === activeTab);
  }, [parsedSections, activeTab]);

  const fontSizeClass = {
    sm: "text-[13px] leading-relaxed",
    base: "text-[14.5px] leading-relaxed tracking-normal",
    lg: "text-[16px] leading-loose tracking-normal",
  }[fontSize];

  if (!prayerPoint) {
    return (
      <div className={`glass-card rounded-2xl p-6 border border-border/50 text-center ${className}`}>
        <Flame size={28} className="mx-auto text-accent/40 mb-2" />
        <h3 className="font-serif font-bold text-base text-foreground">Today's Prayer Focus</h3>
        <p className="text-xs text-muted-foreground mt-1">No active prayer point bulletin available today.</p>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-2xl border border-border/60 bg-card/90 shadow-xl overflow-hidden flex flex-col ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-border/50 bg-card/70">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0 shadow-sm shadow-accent/10">
              <Flame size={16} className="text-accent animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-serif font-bold text-accent truncate">
                Today's Prayer Focus
              </h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                <span>📅 {todaysDate}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Text Resizer & Copy) */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/50">
              <button
                onClick={() => setFontSize("sm")}
                title="Smaller text"
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  fontSize === "sm" ? "bg-accent/20 text-accent font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("base")}
                title="Standard text"
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  fontSize === "base" ? "bg-accent/20 text-accent font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                title="Larger text"
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  fontSize === "lg" ? "bg-accent/20 text-accent font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                A+
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-[11px] gap-1 border-border/50 bg-background/50 text-muted-foreground hover:text-foreground hover:border-accent/40"
              title="Copy Prayer Focus"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Weekly Category Pill or Switcher */}
        {allPrayerPoints.length > 1 && onSelectPrayerPoint ? (
          <div className="relative mt-2">
            <select
              value={prayerPoint.id}
              onChange={(e) => {
                const found = allPrayerPoints.find(p => p.id === e.target.value);
                if (found) onSelectPrayerPoint(found);
              }}
              className="w-full text-xs bg-muted/30 border border-border/50 rounded-lg py-1 px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent truncate font-medium cursor-pointer"
            >
              {allPrayerPoints.map((p, idx) => (
                <option key={p.id} value={p.id} className="bg-popover text-foreground">
                  Focus #{idx + 1}: {sanitizeText(p.title).slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        ) : prayerPoint.category ? (
          <div className="mt-1">
            <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent truncate max-w-full">
              {sanitizeText(prayerPoint.category)}
            </span>
          </div>
        ) : null}

        {/* Section Segment Tabs (Point 1, Point 2, Point 3...) */}
        {parsedSections.length > 1 && (
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border/40 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-all ${
                activeTab === "all"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              All Points ({parsedSections.length})
            </button>
            {parsedSections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-all ${
                  activeTab === sec.id
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Point {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Prayer Text Body (Optimized Line Length & Legibility) */}
      <div className={`p-4 sm:p-5 overflow-y-auto space-y-6 ${maxHeight} pr-2 sm:pr-3`}>
        {visibleSections.map((section, sIdx) => (
          <article
            key={section.id}
            className={`space-y-3.5 max-w-prose mx-auto ${
              sIdx > 0 ? "pt-5 border-t border-border/40" : ""
            }`}
          >
            {/* Section Badge & Time Slot */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                {section.badge}
              </span>
              {section.timeSlot && (
                <span className="text-[11px] text-muted-foreground/80 font-medium flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-md">
                  <Clock size={11} className="text-accent" />
                  {section.timeSlot}
                </span>
              )}
            </div>

            {/* Prayer Topic Title */}
            {section.title && (
              <h3 className="font-serif font-bold text-sm sm:text-base text-foreground leading-snug tracking-normal">
                {section.title}
              </h3>
            )}

            {/* Scripture Illuminated Callout Box */}
            {section.scriptures.length > 0 && (
              <div className="rounded-xl border-l-4 border-accent bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-3 sm:p-4 my-2.5 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent uppercase tracking-wider">
                  <BookOpen size={13} />
                  <span>Scripture Foundation</span>
                </div>
                {section.scriptures.map((scrip, scripIdx) => (
                  <blockquote
                    key={scripIdx}
                    className="font-serif italic text-foreground/90 text-xs sm:text-[13.5px] leading-relaxed pl-1"
                  >
                    “{scrip.replace(/^["“']|["”']$/g, "")}”
                  </blockquote>
                ))}
              </div>
            )}

            {/* Prayer Directives & Declarations */}
            {section.declarations.length > 0 ? (
              <div className="space-y-3">
                {section.declarations.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className={`text-foreground/85 font-normal ${fontSizeClass} selection:bg-accent selection:text-accent-foreground text-left`}
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : null}
          </article>
        ))}

        {/* Closing Ministry Benediction / Intercession Seal */}
        <div className="pt-4 border-t border-border/30 text-center max-w-prose mx-auto">
          <p className="text-[11px] font-serif italic text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-accent" />
            <span>United in prayer • Effectual fervent intercession availeth much</span>
          </p>
        </div>
      </div>
    </div>
  );
}
