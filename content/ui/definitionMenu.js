import {showTranslateMenu} from "./translateMenu";
import {detectLang} from "../services/translate";
import {updateWordDetails} from "../updateWordDetails";
import {fetchWiktionaryDefinition} from "../services/wiktionary";
import {fetchWordData} from "../services/dictionary";

export function showDefinitionMenu(state) {
    const lastSelectedText = state.lastSelectedTextRef.value;
    const menuBox = state.menuBoxRef.value;
    if (!menuBox) return;
    menuBox.innerHTML = `
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width:400px;
        ">
            <!-- Верхнє горизонтальне меню -->
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
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                ">+</button>
                
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

            <!-- Слово -->
            <div style="margin-bottom: 10px;">
                <div  id="sourceTextDisplay"  style="font-size: 20px; font-weight: bold;">${lastSelectedText} 
                    <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">'pronunciation'</div>
            </div>
            
            <div id="definitionsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 5px;">Definitions:</div>
                <div id="definitionList" style="font-size: 14px;"></div>
            </div>
        </div>
    `;
    console.log(fetchWordData(lastSelectedText));

    detectLang(lastSelectedText).then(fromLang => {
        console.log("Detected language:", fromLang);
        updateWordDetails(lastSelectedText, fromLang).catch(console.error);
        return fetchWiktionaryDefinition(lastSelectedText, fromLang);
    }).then(defs => {
        const defBox = document.getElementById("definitionList");
        if (!defBox) return;

        if (defs.length === 0) {
            defBox.innerHTML = `<div style="color: #ccc;">No definitions found.</div>`;
        } else {
            defBox.innerHTML = defs.map((entry, index) => {
                const examplesHtml = entry.examples.length > 0
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
    }).catch(error => {
        const defBox = document.getElementById("definitionList");
        if (defBox) {
            defBox.innerHTML = `<div style="color: white;">Error fetching definition.</div>`;
        }
        console.error("Definition or language detection failed:", error);
    });

    // Дії
    document.getElementById("translateBtn").onclick = (e) => {
        e.stopPropagation();
        showTranslateMenu(state);
    };
    document.getElementById("showSynonymsBtn").onclick = () => alert("Show synonyms...");
}