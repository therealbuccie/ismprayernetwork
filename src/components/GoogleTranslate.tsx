import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const GoogleTranslate = () => {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // Inject styles to hide Google branding and beautify the widget
    const style = document.createElement("style");
    style.textContent = `
      .goog-te-gadget > span { display: none !important; }
      .goog-te-gadget { font-size: 0 !important; }
      .goog-te-gadget .goog-te-combo {
        font-family: inherit !important;
        font-size: 13px !important;
        padding: 6px 10px !important;
        border-radius: 8px !important;
        border: 1px solid hsl(var(--border)) !important;
        background: hsl(var(--background)) !important;
        color: hsl(var(--foreground)) !important;
        outline: none !important;
        cursor: pointer !important;
        width: 100% !important;
        appearance: auto !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
      }
      .goog-te-gadget .goog-te-combo:hover {
        border-color: hsl(var(--accent)) !important;
      }
      .goog-te-gadget .goog-te-combo:focus {
        border-color: hsl(var(--accent)) !important;
        box-shadow: 0 0 0 2px hsl(var(--accent) / 0.15) !important;
      }
      .goog-logo-link { display: none !important; }
      .goog-te-banner-frame { display: none !important; }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
      .skiptranslate + div #google_translate_element { display: block !important; }
      #google_translate_element .skiptranslate { display: block !important; }
      #google_translate_element { min-height: 32px; }
    `;
    document.head.appendChild(style);
  }, []);

  return <div id="google_translate_element" />;
};

export default GoogleTranslate;
