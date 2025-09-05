import { removeHelper, showHelperIcon } from "./ui/helperIcon";
import { removeMenu } from "./ui/menu";

export function handleSelectionChange(state) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
        state.pendingSelectionRef.value = null;
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    state.pendingSelectionRef.value = {
        text: selectedText,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
    };
}

export function handleMouseUp(state) {
    setTimeout(() => {
        const pending = state.pendingSelectionRef.value;
        if (pending && pending.text !== state.lastSelectedTextRef.value) {
            state.lastSelectedTextRef.value = pending.text;
            showHelperIcon(pending.x, pending.y, state);
        }
    }, 10);
}

export function handleClick(event, state) {
    const helperIcon = state.helperIconRef.value;
    const menuBox = state.menuBoxRef.value;

    const isClickOnMenu = menuBox && menuBox.contains(event.target);
    const isClickOnHelperIcon = helperIcon && helperIcon.contains(event.target);

    if (!isClickOnMenu && !isClickOnHelperIcon) {
        removeMenu(state);
        removeHelper(state);
        state.lastSelectedTextRef.value = "";
    }
}