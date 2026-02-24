import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const GoogleTranslate = () => {
  useEffect(() => {
    // Avoid re-initializing
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
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="google_translate_element"
      className="[&_.goog-te-gadget]:!font-sans [&_.goog-te-combo]:!text-xs [&_.goog-te-combo]:!rounded-md [&_.goog-te-combo]:!border-border [&_.goog-te-combo]:!bg-background [&_.goog-te-combo]:!text-foreground [&_.goog-te-combo]:!py-1 [&_.goog-te-combo]:!px-2 [&_.goog-te-gadget-simple]:!border-none [&_.goog-te-gadget-simple]:!bg-transparent [&_span]:!text-xs"
    />
  );
};

export default GoogleTranslate;
