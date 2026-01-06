import { fetchWordData } from "./services/dictionary.js";
import { getSpeechSupport } from "./services/langUtils.js";

export async function updateWordDetails(word, fromLang) {
    const pronunciationText = document.getElementById("pronunciationText");
    const audioBtn = document.getElementById("playPronunciation");

    let audioUrl = null;
    let pronunciation = "";
    let hasSpeechSynthesis = false;

    if (fromLang === "EN") {
        const wordData = await fetchWordData(word);
        if (wordData) {
            pronunciation = wordData.phonetics.find(p => p.text)?.text || "";
            audioUrl = wordData.phonetics.find(p => p.audio)?.audio || null;
            if (window._wordDetails === undefined) {
                window._wordDetails = wordData;
            }
        }
    }

    if (!audioUrl) {
        hasSpeechSynthesis = await getSpeechSupport(fromLang);
    }

    if (audioBtn) {
        if (audioUrl || hasSpeechSynthesis) {
            audioBtn.style.display = "inline";
            audioBtn.onclick = () => {
                if (audioUrl) {
                    new Audio(audioUrl).play();
                } else {
                    const utterance = new SpeechSynthesisUtterance(word);
                    utterance.lang = fromLang.toLowerCase();
                    speechSynthesis.speak(utterance);
                }
            };
        } else {
            audioBtn.style.display = "none";
        }
    }

    if (pronunciationText) {
        pronunciationText.textContent = pronunciation || "";
    }
}
