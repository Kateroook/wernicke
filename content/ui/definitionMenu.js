import {showTranslateMenu} from "./translateMenu";
import {showSynonymsMenu} from "./synonymsMenu";
import {detectLang} from "../services/translate";
import {fetchWordData} from "../services/dictionary";
import {WordData, WordManager} from "../services/wordData";
import {getSpeechSupport} from "../services/langUtils";

const wordManager = new WordManager();

export function showDefinitionMenu(state) {
    const lastSelectedText = state.lastSelectedTextRef.value;
    const menuBox = state.menuBoxRef.value;
    const surroundingText = state.lastSurroundingTextRef?.value;
    
    if (!menuBox) return;
    
    // Check if we have a selected text
    if (!lastSelectedText || lastSelectedText.trim() === '') {
        console.error("No text selected for definition menu");
        return;
    }

    // Create WordData object with surrounding text
    const wordData = new WordData(lastSelectedText, "EN", surroundingText);

    console.log("Word data", wordData);
    // Show loading state
    renderDefinitionMenu(wordData, state, true);
    
    // Load word data asynchronously
    loadWordData(wordData).then(() => {
        renderDefinitionMenu(wordData, state, false);
    }).catch(error => {
        console.error("Failed to load word data:", error);
        renderDefinitionMenu(wordData, state, false, error);
    });
}

async function loadWordData(wordData) {
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
            const hasDefinition = existingWord.definition?.definitions?.length > 0;
            
            if (hasDefinition) {
                console.log("Using cached word data for definition:", wordData.text);
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
                console.log("Cached definition data is empty, loading fresh data for:", wordData.text);
            }
        }
        
        console.log("Loading new word data for definition:", wordData.text);
        
        // Detect language
        const detectedLang = await detectLang(wordData.text);
        wordData.sourceLanguage = detectedLang;
        
        // Load pronunciation and basic data
        await loadPronunciation(wordData);
        
        // Load definitions
        await loadDefinitions(wordData);
        
        // Save to word manager
        await wordManager.saveWord(wordData);
        
    } catch (error) {
        console.error("Error loading word data:", error);
        throw error;
    }
}

async function loadPronunciation(wordData) {
    if (wordData.sourceLanguage === "EN") {
        try {
            const wordApiData = await fetchWordData(wordData.text);
            if (wordApiData) {
                const phonetic = wordApiData.phonetics?.find(p => p.text)?.text || "";
                const audioUrl = wordApiData.phonetics?.find(p => p.audio)?.audio || null;
                wordData.updatePronunciation(phonetic, audioUrl);
            }
        } catch (error) {
            console.error("Failed to load pronunciation from API:", error);
        }
    }
    
    // Check for speech synthesis support
    if (!wordData.pronunciation.audioUrl) {
        const hasSpeechSynthesis = await getSpeechSupport(wordData.sourceLanguage);
        wordData.updatePronunciation(
            wordData.pronunciation.phonetic, 
            null, 
            hasSpeechSynthesis
        );
    }
}

async function loadDefinitions(wordData) {
    try {
        const response = await fetchWordData(wordData.text, wordData.sourceLanguage, wordData.context.surroundingText);
        const definitionText = response?.definition || "";
        
        // Parse the structured response from backend
        const parsedDefinitions = parseDefinitionResponse(definitionText);
        wordData.updateDefinition(parsedDefinitions);
    } catch (error) {
        console.error("Failed to load definitions:", error);
        wordData.updateDefinition([]);
    }
}

function parseDefinitionResponse(definitionText) {
    if (!definitionText) return [];
    
    const lines = definitionText.split('\n').filter(line => line.trim());
    const definitions = [];
    let currentDefinition = null;
    let popularUses = "";
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('Definition:')) {
            if (currentDefinition) {
                definitions.push(currentDefinition);
            }
            currentDefinition = {
                definition: trimmedLine.replace('Definition:', '').trim(),
                examples: []
            };
        } else if (trimmedLine.startsWith('Popular uses:')) {
            popularUses = trimmedLine.replace('Popular uses:', '').trim();
            if (currentDefinition && popularUses) {
                currentDefinition.definition += `\n\nPopular uses: ${popularUses}`;
            }
        } else if (trimmedLine.startsWith('Example 1:') || trimmedLine.startsWith('Example 2:')) {
            if (currentDefinition) {
                const example = trimmedLine.replace(/^Example \d+:/, '').trim();
                if (example) {
                    currentDefinition.examples.push(example);
                }
            }
        }
    }
    
    if (currentDefinition) {
        definitions.push(currentDefinition);
    }
    
    return definitions;
}


function renderDefinitionMenu(wordData, state, isLoading = false, error = null) {
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
                ">Definition</button>          

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
                ">Synonyms</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="font-size: 20px; font-weight: bold;">
                    ${wordData.text}
                    ${(wordData.pronunciation.audioUrl || wordData.pronunciation.hasSpeechSynthesis) 
                        ? '<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>' 
                        : ''}
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">
                    ${wordData.pronunciation.phonetic || ''}
                </div>
            </div>
            
            <!-- Definitions section -->
            <div id="definitionsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 5px;">Definitions:</div>
                <div id="definitionList" style="font-size: 14px;">
                    ${isLoading ? '<div style="color: #ccc;">Loading...</div>' : 
                      error ? '<div style="color: #ff6b6b;">Error loading definitions</div>' :
                      renderDefinitions(wordData.definition.definitions)}
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
    setupDefinitionMenuEvents(wordData, state);
}

function renderDefinitions(definitions) {
    if (definitions.length === 0) {
        return '<div style="color: #ccc;">No definitions found.</div>';
    }
    
    return definitions.map((entry, index) => {
        const examplesHtml = entry.examples && entry.examples.length > 0
            ? `<ul style="margin: 5px 0 10px 20px; padding: 0; color: #ddd;">
                ${entry.examples.map(ex => `<li style="margin-bottom: 3px;">${ex}</li>`).join("")}
               </ul>`
            : "";
        return `
            <div style="margin-bottom: 10px;">
                <div><b>${index + 1}.</b> ${entry.definition}</div>
                ${examplesHtml}
            </div>
        `;
    }).join("");
}


function setupDefinitionMenuEvents(wordData, state) {
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
            renderDefinitionMenu(wordData, state, false);
        };
    }

    // Pronunciation button
    const playPronunciation = document.getElementById("playPronunciation");
    if (playPronunciation) {
        playPronunciation.onclick = () => {
            if (wordData.pronunciation.audioUrl) {
                new Audio(wordData.pronunciation.audioUrl).play();
            } else if (wordData.pronunciation.hasSpeechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(wordData.text);
                utterance.lang = wordData.sourceLanguage.toLowerCase();
                speechSynthesis.speak(utterance);
            }
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