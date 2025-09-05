export async function fetchWiktionaryDefinition(word, langCode) {
    const url = `https://${langCode}.wiktionary.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(word.toLowerCase())}&origin=*`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data?.parse?.text?.["*"]) {
            const html = data.parse.text["*"];
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const results = [];

            const lis = doc.querySelectorAll("ol > li");
            for (let li of lis) {
                let raw = li.innerText.trim().split('\n')[0];
                if (!raw || raw.length < 5) continue;

                const examples = [];
                li.querySelectorAll("ul li, blockquote").forEach(el => {
                    let ex = el.innerText.trim();
                    if (ex.includes(':')) {
                        const i = ex.lastIndexOf(':');
                        ex = ex.slice(i + 1).trim();
                    }
                    ex = ex.replace(/^["'–—-]+/, '').trim();
                    if (ex.length >= 3) examples.push(ex);
                });

                results.push({ definition: raw, examples });
                if (results.length >= 3) break;
            }
            return results;
        }

    } catch (err) {
        console.error("Wiktionary fetch error:", err);
        return [];
    }
}
