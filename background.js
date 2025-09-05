chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DEFINE") {
        fetch("http://localhost:3000/define", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word: message.word })
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ data }))
            .catch((err) => sendResponse({ error: err.message }));

        return true; // важливо, щоб sendResponse працював асинхронно
    }
});