import { I18nProvider } from "@refinedev/core";

/**
 * Internationalization (i18n) provider for handling translations and locales.
 *
 * Documentation: https://refine.dev/docs/api-reference/core/providers/i18n-provider/
 */
export const i18nProvider: I18nProvider = {
  /**
   * Translates a given key based on the current locale.
   * If translation is not found, it returns the provided default message.
   */
  translate: (key: string, options?: any, defaultMessage?: string): string => {
    // console.log("translate called with:", { key, options, defaultMessage });

    // Example translations dictionary (replace with an actual i18n library)
    const translations: Record<string, Record<string, string>> = {
      en: {
        "welcome.message": "Welcome",
        "error.notFound": "Not found",
      },
      it: {
        "welcome.message": "Benvenuto",
        "error.notFound": "Non trovato",
      },
    };

    // Get current locale
    const locale = i18nProvider.getLocale();

    return translations[locale]?.[key] || defaultMessage || key;
  },

  /**
   * Changes the locale and stores it in localStorage.
   */
  changeLocale: async (lang: string, options?: any): Promise<void> => {
    // console.log("changeLocale called with:", { lang, options });

    // Save the locale in localStorage
    localStorage.setItem("app_locale", lang);
    // console.log(`Language changed to: ${lang}`);
  },

  /**
   * Gets the current locale from localStorage or falls back to browser settings.
   */
  getLocale: (): string => {
    // console.log("getLocale called");

    // Retrieve locale from localStorage or fallback to browser settings
    return (
      localStorage.getItem("app_locale") ||
      navigator.language.split("-")[0] || // Extract primary language (e.g., 'en' from 'en-US')
      "en"
    );
  },
};

export default i18nProvider;
