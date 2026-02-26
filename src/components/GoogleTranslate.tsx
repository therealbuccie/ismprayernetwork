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

    const style = document.createElement("style");
    style.textContent = `
      /* Hide the Google top bar that shifts the page */
      body > .skiptranslate { display: none !important; }
      body { top: 0 !important; }

      /* Style the widget inside our container */
      #google_translate_element .goog-te-gadget > span,
      #google_translate_element .goog-logo-link,
      #google_translate_element .goog-te-gadget > div > a { display: none !important; }
      #google_translate_element .goog-te-gadget { font-size: 0 !important; line-height: 0 !important; }
      #google_translate_element .goog-te-combo {
        font-family: inherit !important;
        font-size: 14px !important;
        padding: 10px 12px !important;
        border-radius: 8px !important;
        border: 1px solid hsl(var(--border)) !important;
        background: hsl(var(--background)) !important;
        color: hsl(var(--foreground)) !important;
        outline: none !important;
        cursor: pointer !important;
        width: 100% !important;
        -webkit-appearance: menulist !important;
        appearance: menulist !important;
        position: relative !important;
        z-index: 999999 !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
      }
      #google_translate_element .goog-te-combo:hover {
        border-color: hsl(var(--accent)) !important;
      }
      #google_translate_element .goog-te-combo:focus {
        border-color: hsl(var(--accent)) !important;
        box-shadow: 0 0 0 2px hsl(var(--accent) / 0.15) !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return <div id="google_translate_element" className="min-h-[34px]" />;
};

export default GoogleTranslate;
