import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "sq", label: "Shqip" },
  { code: "am", label: "አማርኛ" },
  { code: "ar", label: "العربية" },
  { code: "hy", label: "Հայերեն" },
  { code: "az", label: "Azərbaycan" },
  { code: "eu", label: "Euskara" },
  { code: "be", label: "Беларуская" },
  { code: "bn", label: "বাংলা" },
  { code: "bs", label: "Bosanski" },
  { code: "bg", label: "Български" },
  { code: "ca", label: "Català" },
  { code: "ceb", label: "Cebuano" },
  { code: "ny", label: "Chichewa" },
  { code: "zh-CN", label: "中文 (简)" },
  { code: "zh-TW", label: "中文 (繁)" },
  { code: "co", label: "Corsu" },
  { code: "hr", label: "Hrvatski" },
  { code: "cs", label: "Čeština" },
  { code: "da", label: "Dansk" },
  { code: "nl", label: "Nederlands" },
  { code: "eo", label: "Esperanto" },
  { code: "et", label: "Eesti" },
  { code: "tl", label: "Filipino" },
  { code: "fi", label: "Suomi" },
  { code: "fr", label: "Français" },
  { code: "fy", label: "Frysk" },
  { code: "gl", label: "Galego" },
  { code: "ka", label: "ქართული" },
  { code: "de", label: "Deutsch" },
  { code: "el", label: "Ελληνικά" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ht", label: "Kreyòl" },
  { code: "ha", label: "Hausa" },
  { code: "haw", label: "ʻŌlelo Hawaiʻi" },
  { code: "iw", label: "עברית" },
  { code: "hi", label: "हिन्दी" },
  { code: "hmn", label: "Hmong" },
  { code: "hu", label: "Magyar" },
  { code: "is", label: "Íslenska" },
  { code: "ig", label: "Igbo" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ga", label: "Gaeilge" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "jw", label: "Basa Jawa" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "kk", label: "Қазақ" },
  { code: "km", label: "ខ្មែរ" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "ko", label: "한국어" },
  { code: "ku", label: "Kurdî" },
  { code: "ky", label: "Кыргызча" },
  { code: "lo", label: "ລາວ" },
  { code: "la", label: "Latina" },
  { code: "lv", label: "Latviešu" },
  { code: "lt", label: "Lietuvių" },
  { code: "lb", label: "Lëtzebuergesch" },
  { code: "mk", label: "Македонски" },
  { code: "mg", label: "Malagasy" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ml", label: "മലയാളം" },
  { code: "mt", label: "Malti" },
  { code: "mi", label: "Te Reo Māori" },
  { code: "mr", label: "मराठी" },
  { code: "mn", label: "Монгол" },
  { code: "my", label: "မြန်မာ" },
  { code: "ne", label: "नेपाली" },
  { code: "no", label: "Norsk" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "ps", label: "پښتو" },
  { code: "fa", label: "فارسی" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
  { code: "sm", label: "Gagana Sāmoa" },
  { code: "gd", label: "Gàidhlig" },
  { code: "sr", label: "Српски" },
  { code: "st", label: "Sesotho" },
  { code: "sn", label: "Shona" },
  { code: "sd", label: "سنڌي" },
  { code: "si", label: "සිංහල" },
  { code: "sk", label: "Slovenčina" },
  { code: "sl", label: "Slovenščina" },
  { code: "so", label: "Soomaali" },
  { code: "es", label: "Español" },
  { code: "su", label: "Basa Sunda" },
  { code: "sw", label: "Kiswahili" },
  { code: "sv", label: "Svenska" },
  { code: "tg", label: "Тоҷикӣ" },
  { code: "ta", label: "தமிழ்" },
  { code: "tt", label: "Татарча" },
  { code: "te", label: "తెలుగు" },
  { code: "th", label: "ไทย" },
  { code: "tr", label: "Türkçe" },
  { code: "tk", label: "Türkmen" },
  { code: "uk", label: "Українська" },
  { code: "ur", label: "اردو" },
  { code: "ug", label: "ئۇيغۇرچە" },
  { code: "uz", label: "O'zbek" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "cy", label: "Cymraeg" },
  { code: "xh", label: "isiXhosa" },
  { code: "yi", label: "ייִדיש" },
  { code: "yo", label: "Yorùbá" },
  { code: "zu", label: "isiZulu" },
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
