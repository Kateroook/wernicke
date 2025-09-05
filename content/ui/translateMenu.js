import {detectLang, fetchTranslation} from "../services/translate";
import {updateWordDetails} from "../updateWordDetails";
import {showDefinitionMenu} from "./definitionMenu";

export function showTranslateMenu(state) {
    const lastSelectedText = state.lastSelectedTextRef.value;
    const menuBox = state.menuBoxRef.value;

    detectLang(lastSelectedText).then(lang => {
        const fromLang = lang || "EN";
        console.log("Detected language:", fromLang);
        if (!menuBox) return;
        menuBox.innerHTML = `
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
                ">
                    <option value="EN" >EN</option>
                    <option value="UK" selected>UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

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
                ">Definition</button>
            </div>

            <!-- Перекладене слово -->
            <div style="margin-bottom: 10px;">
                <div  id="sourceTextDisplay"  style="font-size: 20px; font-weight: bold;">${lastSelectedText} 
                    <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">'pronunciation'</div>
            </div>

            <!-- Переклад -->
            <div style="
                background: white;
                color: #0057d8;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 12px;
            " id="translatedText">
            ...
            </div>
        </div>
    `;
        document.getElementById("fromLang").value = fromLang;

        // Оновити переклад
        const toLangSelect = document.getElementById("toLang");
        const translatedDiv = document.getElementById("translatedText");
        const fromLangVal = document.getElementById("fromLang").value;


        if (toLangSelect && translatedDiv) {
            const toLang = toLangSelect.value;
            const fromLang = fromLangVal;
            translatedDiv.textContent = `[${lastSelectedText} → ${toLang}]`;

            fetchTranslation(fromLang, lastSelectedText, toLang).then(result => {
                translatedDiv.textContent = result;
            });
        }
        updateWordDetails(lastSelectedText, fromLangVal).catch(console.error);

        // Обробка ↔
        document.getElementById("swapLangs").onclick = async () => {
            const from = document.getElementById("fromLang");
            const to = document.getElementById("toLang");
            const translatedDiv = document.getElementById("translatedText");
            const sourceTextDiv = document.getElementById("sourceTextDisplay");

            if (!from || !to || !translatedDiv || !sourceTextDiv) return;

            const tmp = from.value;
            from.value = to.value;
            to.value = tmp;

            const newInputText = translatedDiv.textContent.trim();
            state.lastSelectedTextRef.value = newInputText;

            sourceTextDiv.innerHTML = `${newInputText} <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">🔊</span>`;

            translatedDiv.textContent = await fetchTranslation(from.value, newInputText, to.value);

            await updateWordDetails(newInputText, from.value);

        };

        document.getElementById("toLang").addEventListener("change", () => {
            const toLang = document.getElementById("toLang").value;
            const fromLang = document.getElementById("fromLang").value;
            const translatedDiv = document.getElementById("translatedText");

            if (translatedDiv) {
                fetchTranslation(fromLang, lastSelectedText, toLang).then(result => {
                    translatedDiv.textContent = result;
                });
            }
        });

        // Дії
        document.getElementById("showSynonymsBtn").onclick = () => alert("Show synonyms...");
        document.getElementById("showDefinitionBtn").onclick = (e) => {
            e.stopPropagation();
            showDefinitionMenu(state);
        };
    });
}