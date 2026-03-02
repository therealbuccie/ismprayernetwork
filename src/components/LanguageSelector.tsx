import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
  { code: "zh-CN", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "sw", label: "Kiswahili" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "ru", label: "Русский" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
];

interface LanguageSelectorProps {
  variant?: "dropdown" | "inline";
}

const LanguageSelector = ({ variant = "dropdown" }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (code: string) => {
    setOpen(false);
    if (code === "en") {
      // If English, just reload the original page
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }
    const currentUrl = window.location.href;
    window.open(
      `https://translate.google.com/translate?sl=en&tl=${code}&u=${encodeURIComponent(currentUrl)}`,
      "_blank",
      "noopener"
    );
  };

  if (variant === "inline") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
          <Globe size={12} /> Select Language
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="text-left text-sm px-3 py-2 rounded-lg hover:bg-accent/10 hover:text-accent text-popover-foreground transition-colors truncate"
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
          open
            ? "text-accent bg-accent/10"
            : "text-foreground/70 hover:text-accent hover:bg-accent/10"
        }`}
        title="Translate"
        aria-label="Translate page"
      >
        <Globe size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-[240px] rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg z-[100] p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              🌐 Translate Page
            </p>
            <div className="grid grid-cols-2 gap-1 max-h-[260px] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className="text-left text-sm px-3 py-2 rounded-lg hover:bg-accent/10 hover:text-accent text-popover-foreground transition-colors truncate"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
