chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DEFINE") {
        fetch("http://localhost:3000/define", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                word: message.word,
                sourceLang: message.sourceLang,
                surroundingText: message.surroundingText
            })
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ data }))
            .catch((err) => sendResponse({ error: err.message }));

        return true; // важливо, щоб sendResponse працював асинхронно
    }
    if (message.type === "EXPLAIN") {
        fetch("http://localhost:3000/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: message.text,
                sourceLang: message.sourceLang,
                targetLang: message.targetLang,
                surroundingText: message.surroundingText,
            })
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ data }))
            .catch((err) => sendResponse({ error: err.message }));

        return true;
    }
    if (message.type === "SYNONYMS") {
        fetch("http://localhost:3000/synonyms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: message.text,
                sourceLang: message.sourceLang,
                surroundingText: message.surroundingText,
            })
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ data }))
            .catch((err) => sendResponse({ error: err.message }));

        return true;
    }
});