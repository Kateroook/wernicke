import { showMenu } from './menu.js';

export function showHelperIcon(x, y, state) {
    removeHelper(state);

    const helper = document.createElement("div");
    helper.className = "helper-icon";
    const iconUrl = chrome.runtime.getURL("../assets/wernicke_logo_big.png");
    helper.style.backgroundImage = `url(${iconUrl})`;
    helper.style.position = "absolute";
    helper.style.left = `${x + 10}px`;
    helper.style.top = `${y + 30}px`;
    helper.style.width = "32px";
    helper.style.height = "32px";
    helper.style.backgroundSize = "cover";
    helper.style.cursor = "pointer";
    helper.style.zIndex = 9999;

    helper.addEventListener("click", (e) => {
        console.log("Icon clicked");
        e.stopPropagation();
        showMenu(x, y, state);
    });

    document.body.appendChild(helper);
    state.helperIconRef.value = helper;
}
export function removeHelper(state) {
    const helperIcon = state.helperIconRef.value;
    if (helperIcon && helperIcon.parentNode) {
        helperIcon.parentNode.removeChild(helperIcon);
        state.helperIconRef.value = null;
    }
}