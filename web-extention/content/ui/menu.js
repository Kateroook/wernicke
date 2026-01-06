import { showTranslateMenu } from './translateMenu.js';
import { showDefinitionMenu } from './definitionMenu.js';
import { showSynonymsMenu } from './synonymsMenu.js';

export function showMenu(x, y, state) {
    removeMenu(state);

    console.log("Show menu");
    const menu = document.createElement("div");
    menu.id = "helper-menu";
    menu.style.position = "absolute";
    menu.style.left = `${x}px`;
    menu.style.top = `${y + 25}px`;
    menu.style.zIndex = 9999;

    document.body.appendChild(menu);
    state.menuBoxRef.value = menu;
    console.log("Menu appended to body", menu);
    showHorizontalMenu(state);
}

export function removeMenu(state) {
    const menuBox = state.menuBoxRef.value;
    if (menuBox && menuBox.parentNode) {
        menuBox.parentNode.removeChild(menuBox);
        state.menuBoxRef.value = null;
    }
}

function showHorizontalMenu(state) {
    const menuBox = state.menuBoxRef.value;
    if (!menuBox) return;

    menuBox.innerHTML = `
        <div style="
            display: flex;
            gap: 8px;
            background: #0057d8;
            border-radius: 12px;
            padding: 10px 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ">
            <button id="addCardBtn" class="menu-btn">+</button>
            <button id="translateBtn" class="menu-btn">Translate</button>
            <button id="synonymsBtn" class="menu-btn">Synonyms</button>
            <button id="meaningBtn" class="menu-btn">Definition</button>
        </div>
    `;

    styleMenuButtons();

    document.getElementById("translateBtn").onclick = (e) => {
        e.stopPropagation();
        showTranslateMenu(state);
    };

    document.getElementById("synonymsBtn").onclick = (e) => {
        e.stopPropagation();
        showSynonymsMenu(state);
    };

    document.getElementById("meaningBtn").onclick = (e) => {
        e.stopPropagation();
        showDefinitionMenu(state);
    };
}

function styleMenuButtons() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.style.cssText = `
            background: white;
            color: #0057d8;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            min-width: 80px;
        `;
    });
}
