/**
 * I18n class for handling internationalization and localization
 */
declare type LegacyD2I18n = {
    /**
     * Array of source paths to load translations from
     */
    sources: string[];

    /**
     * API instance for making requests
     */
    api: Api;

    /**
     * Set of strings that need to be translated
     */
    strings: Set<string>;

    /**
     * Object containing loaded translations
     */
    translations: Record<string, string> | undefined;

    /**
     * Creates a new I18n instance
     * @param sources - Array of source paths to load translations from
     * @param api - API instance for making requests
     */
    constructor(sources?: string[], api?: Api);

    /**
     * Adds a .properties file to the list of sources to load translations from
     *
     * Files are loaded in the order they're added, and the first translation of each string that's encountered will be
     * used.
     *
     * @param path - Path to the properties file
     */
    addSource(path: string): void;

    /**
     * Adds one or more strings to the list of strings to translate
     *
     * @param strings - String or array of strings to add for translation
     */
    addStrings(strings: string | string[]): void;

    /**
     * Load translations
     *
     * First, all properties files (specified with addSource) are loaded.
     * Then, if any untranslated strings remain, these are POSTed to the i18n endpoint of the DHIS2 API.
     *
     * @returns Promise that resolves to the translations object
     */
    load(): Promise<Record<string, string>>;

    /**
     * Gets the translated version of the specified string
     *
     * If no translation exists for the specified string, the string is returned as is with two asterisks on each side,
     * in order to easily identify missing translations in the UI
     *
     * @param string - The string to translate
     * @param variables - Object containing variables to substitute in the translated string
     * @returns The translated string
     */
    getTranslation(string: string, variables?: Record<string, string>): string;

    /**
     * Check if a translation exists for the specified string
     *
     * @param string - The string to check for translation
     * @returns True if a translation exists, false otherwise
     */
    isTranslated(string: string): boolean;

    /**
     * Get the list of strings that don't have translations
     *
     * If no translations have been loaded yet, `undefined` is returned instead.
     *
     * @returns Array of untranslated strings, or undefined if translations haven't been loaded
     */
    getUntranslatedStrings(): string[] | undefined;

    /**
     * Return a new instance of this class
     *
     * @returns New I18n instance
     */
    static getI18n(): LegacyD2I18n;
};

export type { LegacyD2I18n };
