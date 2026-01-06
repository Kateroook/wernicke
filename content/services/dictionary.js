export async function fetchWordData(word, sourceLang = "EN", surroundingText = null) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: "DEFINE", word, sourceLang, surroundingText },
            (response) => {
                if (!response) {
                    reject(new Error("No response from background"));
                    return;
                }
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.data);
                }
            }
        );
    });
}


export async function fetchFriendlyExplanation({ text, sourceLang, targetLang, surroundingText }) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "EXPLAIN",
                text,
                sourceLang,
                targetLang,
                surroundingText,
            },
            (response) => {
                if (!response) {
                    reject(new Error("No response from background"));
                    return;
                }
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.data);
                }
            }
        );
    });
}

export async function fetchSynonyms({ text, sourceLang, surroundingText }) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "SYNONYMS",
                text,
                sourceLang,
                surroundingText,
            },
            (response) => {
                if (!response) {
                    reject(new Error("No response from background"));
                    return;
                }
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.data);
                }
            }
        );
    });
}
