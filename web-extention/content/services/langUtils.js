export async function getSpeechSupport(langCode) {
    if (!('speechSynthesis' in window)) return false;
    const voices = await new Promise(resolve => {
        let v = speechSynthesis.getVoices();
        if (v.length) return resolve(v);
        speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    });
    return voices.some(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
}
