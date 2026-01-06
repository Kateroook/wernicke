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
    
    // Capture surrounding text (up to 50 characters before and after)
    const surroundingText = getSurroundingText(range, selectedText);
    console.log("Setting pending selection with surrounding text:", surroundingText);
    
    state.pendingSelectionRef.value = {
        text: selectedText,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        surroundingText: surroundingText
    };
}

function getSurroundingText(range, selectedText) {
    try {
        console.log("getSurroundingText called with:", { selectedText, range });
        
        // Get the text content from the range's container
        let textContent = '';
        
        // Try to get text from the range's container
        if (range.commonAncestorContainer) {
            const container = range.commonAncestorContainer;
            console.log("Container type:", container.nodeType, "Container:", container);
            
            if (container.nodeType === Node.TEXT_NODE) {
                textContent = container.textContent || '';
                console.log("Text node content:", textContent);
            } else {
                // For element nodes, get all text content
                textContent = container.textContent || '';
                console.log("Element node content:", textContent);
            }
        }
        
        // If we still don't have text, try getting it from the selection
        if (!textContent) {
            console.log("No text from container, trying selection...");
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const container = selection.getRangeAt(0).commonAncestorContainer;
                console.log("Selection container type:", container.nodeType, "Container:", container);
                
                if (container.nodeType === Node.TEXT_NODE) {
                    textContent = container.parentElement?.textContent || container.textContent || '';
                    console.log("Selection text node content:", textContent);
                } else {
                    textContent = container.textContent || '';
                    console.log("Selection element node content:", textContent);
                }
            }
        }
        
        if (!textContent) {
            console.log("No text content found");
            return null;
        }
        
        // Find the selected text in the content
        const selectedIndex = textContent.indexOf(selectedText);
        console.log("Selected text index:", selectedIndex);
        
        if (selectedIndex === -1) {
            console.log("Selected text not found in content");
            return null;
        }
        
        // Extract surrounding text (50 chars before and after)
        const start = Math.max(0, selectedIndex - 50);
        const end = Math.min(textContent.length, selectedIndex + selectedText.length + 50);
        
        const surroundingText = textContent.substring(start, end).trim();
        console.log("Captured surrounding text:", surroundingText);
        return surroundingText;
    } catch (error) {
        console.error("Error capturing surrounding text:", error);
        return null;
    }
}

export function handleMouseUp(state) {
    setTimeout(() => {
        const pending = state.pendingSelectionRef.value;
        if (pending && pending.text !== state.lastSelectedTextRef.value) {
            state.lastSelectedTextRef.value = pending.text;
            // Store the surrounding text in the state so it's available when menu is shown
            state.lastSurroundingTextRef = state.lastSurroundingTextRef || { value: null };
            state.lastSurroundingTextRef.value = pending.surroundingText;
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