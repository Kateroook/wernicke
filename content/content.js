let helperIcon = null;
let menuBox = null;
let lastSelectedText = "";
let pendingSelection = null;
let lastSurroundingText = null;

import {handleClick,  handleMouseUp, handleSelectionChange} from "./handlers";

const state = {
    helperIconRef: {value:helperIcon},
    menuBoxRef: {value:menuBox},
    lastSelectedTextRef: {value:lastSelectedText},
    pendingSelectionRef: {value:pendingSelection},
    lastSurroundingTextRef: {value:lastSurroundingText},
};

document.addEventListener("selectionchange", () => handleSelectionChange(state));
document.addEventListener("mouseup", () => handleMouseUp(state));
document.addEventListener("click", (event) => handleClick(event, state));