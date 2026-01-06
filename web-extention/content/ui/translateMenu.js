import {detectLang, fetchTranslation} from "../services/translate";
import {showDefinitionMenu} from "./definitionMenu";
import {showSynonymsMenu} from "./synonymsMenu";
import {WordData, WordManager} from "../services/wordData";
import {getSpeechSupport} from "../services/langUtils";
import {fetchFriendlyExplanation} from "../services/dictionary";

const wordManager = new WordManager();

export function showTranslateMenu(state) {
    const lastSelectedText = state.lastSelectedTextRef.value;
    const menuBox = state.menuBoxRef.value;
    const surroundingText = state.lastSurroundingTextRef?.value;

    console.log("showTranslateMenu - lastSelectedText:", lastSelectedText);
    console.log("showTranslateMenu - surroundingText:", surroundingText);

    if (!menuBox) return;
    
    // Check if we have a selected text
    if (!lastSelectedText || lastSelectedText.trim() === '') {
        console.error("No text selected for translate menu");
        return;
    }

    // Create WordData object with surrounding text
    const wordData = new WordData(lastSelectedText, "EN", surroundingText);
    
    console.log("Translate Word data", wordData);
    // Show loading state
    renderTranslateMenu(wordData, state, true);
    
    // Load word data asynchronously
    loadWordDataForTranslation(wordData).then(() => {
        renderTranslateMenu(wordData, state, false);
    }).catch(error => {
        console.error("Failed to load word data:", error);
        renderTranslateMenu(wordData, state, false, error);
    });
}

async function loadWordDataForTranslation(wordData) {
    try {
        // Check if we already have this word data cached by looking for existing word with same text
        const existingWords = wordManager.getAllWords();
        console.log("Cache lookup - searching for:", wordData.text, "on URL:", wordData.context.sourceUrl);
        console.log("Cache lookup - available words:", existingWords.map(w => ({ text: w.text, url: w.context.sourceUrl })));
        
        // First try exact match (same text and URL)
        let existingWord = existingWords.find(word => 
            word.text === wordData.text && 
            word.context.sourceUrl === wordData.context.sourceUrl
        );
        
        // If no exact match, try just same text on same domain (more flexible)
        if (!existingWord) {
            const currentDomain = new URL(wordData.context.sourceUrl).hostname;
            existingWord = existingWords.find(word => 
                word.text === wordData.text && 
                new URL(word.context.sourceUrl).hostname === currentDomain
            );
        }
        
        if (existingWord) {
            // Check if cached data actually has content
            const hasTranslation = !!existingWord.translation?.translatedText;
            const hasDefinition = existingWord.definition?.definitions?.length > 0;
            const hasExplanation = !!existingWord.explanation?.text;
            const hasSynonyms = existingWord.synonyms?.length > 0;
            
            console.log("Cached data check:", {
                hasTranslation,
                hasDefinition, 
                hasExplanation,
                hasSynonyms,
                translation: existingWord.translation,
                definition: existingWord.definition,
                explanation: existingWord.explanation,
                synonyms: existingWord.synonyms
            });
            
            // Only use cached data if it has at least some content
            if (hasTranslation || hasDefinition || hasExplanation || hasSynonyms) {
                console.log("Using cached word data for:", wordData.text);
                // Copy cached data to current wordData, but keep the new ID, timestamp, and surrounding text
                const newId = wordData.id;
                const newTimestamp = wordData.timestamp;
                const newSurroundingText = wordData.context.surroundingText;
                Object.assign(wordData, existingWord);
                wordData.id = newId; // Keep the new ID
                wordData.timestamp = newTimestamp; // Keep the new timestamp
                wordData.context.surroundingText = newSurroundingText; // Keep the new surrounding text
                
                // If cached data is missing some fields, load them fresh
                if (!hasTranslation) {
                    console.log("Loading fresh translation for cached word:", wordData.text);
                    await loadInitialTranslation(wordData);
                }
                if (!hasExplanation) {
                    console.log("Loading fresh explanation for cached word:", wordData.text);
                    const targetLang = wordData.sourceLanguage === "UK" ? "EN" : "UK";
                    await loadFriendlyExplanation(wordData, targetLang);
                }
                
                // Save updated data
                await wordManager.saveWord(wordData);
                return;
            } else {
                console.log("Cached data is empty, loading fresh data for:", wordData.text);
            }
        }
        
        console.log("No cached data found for:", wordData.text);
        
        console.log("Loading new word data for:", wordData.text);
        
        // Clean up any empty cached entries
        await wordManager.cleanupEmptyEntries();
        
        // Detect language
        const detectedLang = await detectLang(wordData.text);
        wordData.sourceLanguage = detectedLang;
        
        // Load pronunciation
        await loadPronunciation(wordData);
        
        // Load initial translation
        await loadInitialTranslation(wordData);
        
        // Load friendly explanation in target language
        const targetLang = wordData.sourceLanguage === "UK" ? "EN" : "UK";
        await loadFriendlyExplanation(wordData, targetLang);
        
        // Save to word manager
        await wordManager.saveWord(wordData);
        
    } catch (error) {
        console.error("Error loading word data:", error);
        throw error;
    }
}

async function loadPronunciation(wordData) {
    // Check for speech synthesis support
    const hasSpeechSynthesis = await getSpeechSupport(wordData.sourceLanguage);
    wordData.updatePronunciation(null, null, hasSpeechSynthesis);
}

async function loadInitialTranslation(wordData) {
    try {
        // Determine target language based on source language
        let targetLang = "UK"; // Default to Ukrainian
        if (wordData.sourceLanguage === "UK") {
            targetLang = "EN"; // If source is Ukrainian, translate to English
        }
        
        const result = await fetchTranslation(wordData.sourceLanguage, wordData.text, targetLang);
        wordData.updateTranslation(targetLang, result);
    } catch (error) {
        console.error("Failed to load initial translation:", error);
        const targetLang = wordData.sourceLanguage === "UK" ? "EN" : "UK";
        wordData.updateTranslation(targetLang, "Translation failed");
    }
}

async function loadFriendlyExplanation(wordData, targetLang) {
    try {
        // For explanation, we want to explain the current word in the target language
        // The source language should be the language of the current word
        console.log("Loading explanation:", {
            text: wordData.text,
            sourceLang: wordData.sourceLanguage,
            targetLang,
            surroundingText: wordData?.context?.surroundingText
        });
        
        const data = await fetchFriendlyExplanation({
            text: wordData.text,
            sourceLang: wordData.sourceLanguage,
            targetLang,
            surroundingText: wordData?.context?.surroundingText || null,
        });
        const explanationText = data?.explanation || "";
        console.log("Explanation received:", explanationText);
        wordData.updateExplanation(targetLang, explanationText);
    } catch (error) {
        console.error("Failed to load friendly explanation:", error);
        wordData.updateExplanation(targetLang, "");
    }
}

function renderTranslateMenu(wordData, state, isLoading = false, error = null) {
    const menuBox = state.menuBoxRef.value;
    if (!menuBox) return;

    const isAddedToWordList = wordData.learningData.addedToWordList;
    const currentTranslation = wordData.translation.translatedText || "...";
    const currentExplanation = wordData.explanation.text || (isLoading ? "" : "");
    
    menuBox.innerHTML = `
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
            max-width: 400px;
            min-width: 400px;
        ">
            <!-- Top horizontal menu -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
                width: 100%;
                box-sizing: border-box;
            ">
                <button style="
                    background: #0057d8;
                    color: white;
                    font-weight: bold;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    line-height: 32px;
                    cursor: default;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Translate</button>

                <select id="fromLang" style="
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    font-size: 14px;
                    padding: 0 8px;
                    appearance: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <option value="EN">EN</option>
                    <option value="UK">UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

                <span id="swapLangs" style="
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 32px;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">↔</span>

                <select id="toLang" style="
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    height: 32px;
                    padding: 0 8px;
                    appearance: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <option value="EN" ${wordData.sourceLanguage === "UK" ? "selected" : ""}>EN</option>
                    <option value="UK" ${wordData.sourceLanguage !== "UK" ? "selected" : ""}>UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

                <button id="addCardBtn" style="
                    background: ${isAddedToWordList ? '#28a745' : 'white'};
                    color: ${isAddedToWordList ? 'white' : '#0057d8'};
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">${isAddedToWordList ? '✓' : '+'}</button>

                <button id="showSynonymsBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    margin-left: auto;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Synonyms</button>

                <button id="showDefinitionBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Definition</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="
                    font-size: 20px; 
                    font-weight: bold;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-width: 100%;
                    box-sizing: border-box;
                ">
                    ${wordData.text}
                    ${wordData.pronunciation.hasSpeechSynthesis 
                        ? '<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>' 
                        : ''}
                </div>
                <div id="pronunciationText" style="
                    color: #ccc; 
                    font-size: 14px;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-width: 100%;
                    box-sizing: border-box;
                ">
                    ${wordData.pronunciation.phonetic || ''}
                </div>
            </div>

            <!-- Translation -->
            <div style="
                background: white;
                color: #0057d8;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 12px;
                max-width: 100%;
                word-wrap: break-word;
                overflow-wrap: break-word;
                box-sizing: border-box;
            " id="translatedText">
                ${isLoading ? 'Loading...' : currentTranslation}
            </div>
            
            <!-- Friendly explanation -->
            <div id="friendlyExplanation" style="
                color: #ffffff;
                opacity: 0.95;
                font-size: 14px;
                line-height: 1.4;
                background: rgba(255,255,255,0.1);
                border-radius: 6px;
                padding: 8px 10px;
                margin-top: 6px;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                max-width: 100%;
                box-sizing: border-box;
            ">
                ${isLoading ? '' : (currentExplanation || '')}
            </div>
            
            <!-- Learning info -->
            ${wordData.learningData.addedToWordList ? `
                <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
                    ✓ Added to word list for learning
                </div>
            ` : ''}
        </div>
    `;

    // Setup event listeners
    setupTranslateMenuEvents(wordData, state);
}

function setupTranslateMenuEvents(wordData, state) {
    // Set initial language
    const fromLangSelect = document.getElementById("fromLang");
    if (fromLangSelect) {
        fromLangSelect.value = wordData.sourceLanguage;
    }

    // Add to word list button
    const addCardBtn = document.getElementById("addCardBtn");
    if (addCardBtn) {
        addCardBtn.onclick = async (e) => {
            e.stopPropagation();
            if (wordData.learningData.addedToWordList) {
                wordData.removeFromWordList();
            } else {
                wordData.addToWordList();
            }
            await wordManager.saveWord(wordData);
            renderTranslateMenu(wordData, state, false);
        };
    }

    // Pronunciation button
    const playPronunciation = document.getElementById("playPronunciation");
    if (playPronunciation) {
        playPronunciation.onclick = () => {
            if (wordData.pronunciation.hasSpeechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(wordData.text);
                utterance.lang = wordData.sourceLanguage.toLowerCase();
                speechSynthesis.speak(utterance);
            }
        };
    }

    // Language change handlers
    const toLangSelect = document.getElementById("toLang");
    if (toLangSelect) {
        toLangSelect.addEventListener("change", async () => {
            const toLang = toLangSelect.value;
            const fromLang = document.getElementById("fromLang").value;
            const translatedDiv = document.getElementById("translatedText");
            const explanationDiv = document.getElementById("friendlyExplanation");

            if (translatedDiv) {
                translatedDiv.textContent = "Loading...";
                if (explanationDiv) explanationDiv.textContent = "";
                try {
                    const result = await fetchTranslation(fromLang, wordData.text, toLang);
                    wordData.updateTranslation(toLang, result);
                    translatedDiv.textContent = result;
                    // Fetch explanation in the new target language
                    await loadFriendlyExplanation(wordData, toLang);
                    if (explanationDiv) explanationDiv.textContent = wordData.explanation.text || "";
                    await wordManager.saveWord(wordData);
                } catch (error) {
                    translatedDiv.textContent = "Translation failed";
                    console.error("Translation error:", error);
                }
            }
        });
    }

    // Swap languages
    const swapLangs = document.getElementById("swapLangs");
    if (swapLangs) {
        swapLangs.onclick = async () => {
            const from = document.getElementById("fromLang");
            const to = document.getElementById("toLang");
            const translatedDiv = document.getElementById("translatedText");
            const sourceTextDiv = document.getElementById("sourceTextDisplay");
            const explanationDiv = document.getElementById("friendlyExplanation");

            if (!from || !to || !translatedDiv || !sourceTextDiv) return;

            const tmp = from.value;
            from.value = to.value;
            to.value = tmp;

            const newInputText = translatedDiv.textContent.trim();
            wordData.text = newInputText;
            wordData.sourceLanguage = from.value;

            sourceTextDiv.innerHTML = `${newInputText} ${wordData.pronunciation.hasSpeechSynthesis 
                ? '<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>' 
                : ''}`;

            translatedDiv.textContent = "Loading...";
            if (explanationDiv) explanationDiv.textContent = "";
            try {
                const result = await fetchTranslation(from.value, newInputText, to.value);
                wordData.updateTranslation(to.value, result);
                translatedDiv.textContent = result;
                // Fetch explanation for swapped languages
                await loadFriendlyExplanation(wordData, to.value);
                if (explanationDiv) explanationDiv.textContent = wordData.explanation.text || "";
                await wordManager.saveWord(wordData);
            } catch (error) {
                translatedDiv.textContent = "Translation failed";
                console.error("Translation error:", error);
            }
        };
    }

    // Definition button
    const showDefinitionBtn = document.getElementById("showDefinitionBtn");
    if (showDefinitionBtn) {
        showDefinitionBtn.onclick = (e) => {
            e.stopPropagation();
            // Update the selected text to current word before showing definition
            state.lastSelectedTextRef.value = wordData.text;
            showDefinitionMenu(state);
        };
    }

    // Synonyms button
    const showSynonymsBtn = document.getElementById("showSynonymsBtn");
    if (showSynonymsBtn) {
        showSynonymsBtn.onclick = (e) => {
            e.stopPropagation();
            // Update the selected text to current word before showing synonyms
            state.lastSelectedTextRef.value = wordData.text;
            showSynonymsMenu(state);
        };
    }
}