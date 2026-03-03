import { useState } from "react";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "sq", label: "Albanian" },
  { code: "am", label: "Amharic" },
  { code: "ar", label: "Arabic" },
  { code: "hy", label: "Armenian" },
  { code: "az", label: "Azerbaijani" },
  { code: "eu", label: "Basque" },
  { code: "be", label: "Belarusian" },
  { code: "bn", label: "Bengali" },
  { code: "bs", label: "Bosnian" },
  { code: "bg", label: "Bulgarian" },
  { code: "ca", label: "Catalan" },
  { code: "ceb", label: "Cebuano" },
  { code: "ny", label: "Chichewa" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "co", label: "Corsican" },
  { code: "hr", label: "Croatian" },
  { code: "cs", label: "Czech" },
  { code: "da", label: "Danish" },
  { code: "nl", label: "Dutch" },
  { code: "eo", label: "Esperanto" },
  { code: "et", label: "Estonian" },
  { code: "tl", label: "Filipino" },
  { code: "fi", label: "Finnish" },
  { code: "fr", label: "French" },
  { code: "fy", label: "Frisian" },
  { code: "gl", label: "Galician" },
  { code: "ka", label: "Georgian" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "gu", label: "Gujarati" },
  { code: "ht", label: "Haitian Creole" },
  { code: "ha", label: "Hausa" },
  { code: "haw", label: "Hawaiian" },
  { code: "iw", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "hmn", label: "Hmong" },
  { code: "hu", label: "Hungarian" },
  { code: "is", label: "Icelandic" },
  { code: "ig", label: "Igbo" },
  { code: "id", label: "Indonesian" },
  { code: "ga", label: "Irish" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "jw", label: "Javanese" },
  { code: "kn", label: "Kannada" },
  { code: "kk", label: "Kazakh" },
  { code: "km", label: "Khmer" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "ko", label: "Korean" },
  { code: "ku", label: "Kurdish" },
  { code: "ky", label: "Kyrgyz" },
  { code: "lo", label: "Lao" },
  { code: "la", label: "Latin" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "lb", label: "Luxembourgish" },
  { code: "mk", label: "Macedonian" },
  { code: "mg", label: "Malagasy" },
  { code: "ms", label: "Malay" },
  { code: "ml", label: "Malayalam" },
  { code: "mt", label: "Maltese" },
  { code: "mi", label: "Maori" },
  { code: "mr", label: "Marathi" },
  { code: "mn", label: "Mongolian" },
  { code: "my", label: "Myanmar" },
  { code: "ne", label: "Nepali" },
  { code: "no", label: "Norwegian" },
  { code: "or", label: "Odia" },
  { code: "ps", label: "Pashto" },
  { code: "fa", label: "Persian" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "pa", label: "Punjabi" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "sm", label: "Samoan" },
  { code: "gd", label: "Scottish Gaelic" },
  { code: "sr", label: "Serbian" },
  { code: "st", label: "Sesotho" },
  { code: "sn", label: "Shona" },
  { code: "sd", label: "Sindhi" },
  { code: "si", label: "Sinhala" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "so", label: "Somali" },
  { code: "es", label: "Spanish" },
  { code: "su", label: "Sundanese" },
  { code: "sw", label: "Swahili" },
  { code: "sv", label: "Swedish" },
  { code: "tg", label: "Tajik" },
  { code: "ta", label: "Tamil" },
  { code: "tt", label: "Tatar" },
  { code: "te", label: "Telugu" },
  { code: "th", label: "Thai" },
  { code: "tr", label: "Turkish" },
  { code: "tk", label: "Turkmen" },
  { code: "uk", label: "Ukrainian" },
  { code: "ur", label: "Urdu" },
  { code: "ug", label: "Uyghur" },
  { code: "uz", label: "Uzbek" },
  { code: "vi", label: "Vietnamese" },
  { code: "cy", label: "Welsh" },
  { code: "xh", label: "Xhosa" },
  { code: "yi", label: "Yiddish" },
  { code: "yo", label: "Yoruba" },
  { code: "zu", label: "Zulu" },
];

const triggerGoogleTranslate = (langCode: string) => {
  // Set the googtrans cookie for Google Translate
  const value = langCode === "en" ? "" : `/en/${langCode}`;
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`;

  // Try to use the Google Translate combo box if available
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (select) {
    select.value = langCode === "en" ? "" : langCode;
    select.dispatchEvent(new Event("change"));
  } else {
    // Fallback: reload to let the cookie take effect
    window.location.reload();
  }
};

interface LanguageSelectorProps {
  variant?: "dropdown" | "inline";
}

const LanguageSelector = ({ variant = "dropdown" }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (code: string) => {
    setOpen(false);
    triggerGoogleTranslate(code);
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
