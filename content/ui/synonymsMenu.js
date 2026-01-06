import {showTranslateMenu} from "./translateMenu";
import {showDefinitionMenu} from "./definitionMenu";
import {detectLang} from "../services/translate";
import {fetchSynonyms} from "../services/dictionary";
import {WordData, WordManager} from "../services/wordData";
import {getSpeechSupport} from "../services/langUtils";

const wordManager = new WordManager();

export function showSynonymsMenu(state) {
    const lastSelectedText = state.lastSelectedTextRef.value;
    const menuBox = state.menuBoxRef.value;
    const surroundingText = state.lastSurroundingTextRef?.value;
    
    if (!menuBox) return;
    
    // Check if we have a selected text
    if (!lastSelectedText || lastSelectedText.trim() === '') {
        console.error("No text selected for synonyms menu");
        return;
    }

    // Create WordData object with surrounding text
    const wordData = new WordData(lastSelectedText, "EN", surroundingText);

    console.log("Synonyms Word data", wordData);
    // Show loading state
    renderSynonymsMenu(wordData, state, true);
    
    // Load word data asynchronously
    loadWordDataForSynonyms(wordData).then(() => {
        renderSynonymsMenu(wordData, state, false);
    }).catch(error => {
        console.error("Failed to load word data:", error);
        renderSynonymsMenu(wordData, state, false, error);
    });
}

async function loadWordDataForSynonyms(wordData) {
    try {
        // Check if we already have this word data cached
        const existingWords = wordManager.getAllWords();
        
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
            const hasSynonyms = existingWord.synonyms?.length > 0;
            
            if (hasSynonyms) {
                console.log("Using cached word data for synonyms:", wordData.text);
                // Copy cached data to current wordData, but keep the new ID, timestamp, and surrounding text
                const newId = wordData.id;
                const newTimestamp = wordData.timestamp;
                const newSurroundingText = wordData.context.surroundingText;
                Object.assign(wordData, existingWord);
                wordData.id = newId;
                wordData.timestamp = newTimestamp;
                wordData.context.surroundingText = newSurroundingText;
                return;
            } else {
                console.log("Cached synonyms data is empty, loading fresh data for:", wordData.text);
            }
        }
        
        console.log("Loading new word data for synonyms:", wordData.text);
        
        // Detect language
        const detectedLang = await detectLang(wordData.text);
        wordData.sourceLanguage = detectedLang;
        
        // Load pronunciation
        await loadPronunciation(wordData);
        
        // Load synonyms
        await loadSynonyms(wordData);
        
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

async function loadSynonyms(wordData) {
    try {
        const response = await fetchSynonyms({
            text: wordData.text,
            sourceLang: wordData.sourceLanguage,
            surroundingText: wordData.context.surroundingText,
        });
        const synonyms = response?.synonyms || [];
        wordData.updateSynonyms(synonyms);
    } catch (error) {
        console.error("Failed to load synonyms:", error);
        wordData.updateSynonyms([]);
    }
}

function renderSynonymsMenu(wordData, state, isLoading = false, error = null) {
    const menuBox = state.menuBoxRef.value;
    if (!menuBox) return;

    const isAddedToWordList = wordData.learningData.addedToWordList;
    
    menuBox.innerHTML = `
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
        ">
            <!-- Top horizontal menu -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
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
                ">Synonyms</button>

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
                ">${isAddedToWordList ? '✓' : '+'}</button>
                
                <button id="translateBtn" style="
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
                ">Translate</button>

                <button id="definitionBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                ">Definition</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="font-size: 20px; font-weight: bold;">
                    ${wordData.text}
                    ${wordData.pronunciation.hasSpeechSynthesis 
                        ? '<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>' 
                        : ''}
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">
                    ${wordData.pronunciation.phonetic || ''}
                </div>
            </div>
            
            <!-- Synonyms section -->
            <div id="synonymsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 10px;">Synonyms:</div>
                <div id="synonymsList" style="font-size: 14px; line-height: 1.6;">
                    ${isLoading ? '<div style="color: #ccc;">Loading synonyms...</div>' : 
                      error ? '<div style="color: #ff6b6b;">Error loading synonyms</div>' :
                      renderSynonyms(wordData.synonyms)}
                </div>
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
    setupSynonymsMenuEvents(wordData, state);
}

function renderSynonyms(synonyms) {
    if (!synonyms || synonyms.length === 0) {
        return '<div style="color: #ccc;">No synonyms found.</div>';
    }
    
    return synonyms.map(synonym => 
        `<span style="
            background: rgba(255,255,255,0.2);
            padding: 4px 8px;
            margin: 3px;
            border-radius: 6px;
            display: inline-block;
            font-size: 13px;
            cursor: pointer;
            transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.backgroundColor='rgba(255,255,255,0.2)'"
           onclick="selectSynonym('${synonym}')">${synonym}</span>`
    ).join("");
}

function setupSynonymsMenuEvents(wordData, state) {
    // Translate button
    const translateBtn = document.getElementById("translateBtn");
    if (translateBtn) {
        translateBtn.onclick = (e) => {
            e.stopPropagation();
            // Update the selected text to current word before showing translate
            state.lastSelectedTextRef.value = wordData.text;
            showTranslateMenu(state);
        };
    }

    // Definition button
    const definitionBtn = document.getElementById("definitionBtn");
    if (definitionBtn) {
        definitionBtn.onclick = (e) => {
            e.stopPropagation();
            // Update the selected text to current word before showing definition
            state.lastSelectedTextRef.value = wordData.text;
            showDefinitionMenu(state);
        };
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
            renderSynonymsMenu(wordData, state, false);
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

    // Make selectSynonym function available globally for onclick handlers
    window.selectSynonym = (synonym) => {
        // Update the selected text and show translate menu for the synonym
        state.lastSelectedTextRef.value = synonym;
        showTranslateMenu(state);
    };
}

// Clean up global function when menu is closed
export function cleanupSynonymsMenu() {
    if (window.selectSynonym) {
        delete window.selectSynonym;
    }
}
