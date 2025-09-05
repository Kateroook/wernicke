export async function fetchTranslation(fromLang, text, toLang) {
    try {
        // Спочатку визначаємо мову тексту
        const sourceLang = fromLang.toLowerCase();

        // Створюємо екземпляр Translator
        const translator = await Translator.create({
            sourceLanguage: sourceLang.toLowerCase(), // API очікує коди у форматі "en", "uk"
            targetLanguage: toLang.toLowerCase(),
        });

        // Виконуємо переклад
        const result = await translator.translate(text);

        translator.destroy(); // звільняємо ресурси
        return result || "[No translation]";
    } catch (err) {
        console.error("Translation failed:", err);
        return "[No translation]";
    }
}
export async function detectLang(text) {
    try{
        const detector = await LanguageDetector.create();
        const results = await detector.detect(text);

        if (results && results.length > 0) {
            console.log("Detected language:", results[0].detectedLanguage);
            return results[0].detectedLanguage.toUpperCase();
        }
        detector.destroy();
        return "EN"; // fallback
    } catch (err) {
        console.error("Language detection failed:", err);
        return "EN";
    }
}