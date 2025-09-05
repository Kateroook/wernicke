export async function fetchWordData(word) {
    chrome.runtime.sendMessage(
        { type: "DEFINE", word },
        (response) => {
            if (response.error) {
                console.error("Error:", response.error);
            } else {
                console.log("Definition:", response.data);
                // тут можна оновити UI з дефініцією
            }
        }
    );
}

