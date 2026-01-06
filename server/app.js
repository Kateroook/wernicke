import express from "express";
const app = express();
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";


app.use(express.json());

// CORS middleware
app.use(cors({
    origin: "chrome-extension://jnhkodgkcgnkchllpijnekmbpcgocdbd",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Додаємо Access-Control-Allow-Private-Network у preflight
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Origin", "chrome-extension://jnhkodgkcgnkchllpijnekmbpcgocdbd");
        res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
        res.header("Access-Control-Allow-Private-Network", "true");
        return res.sendStatus(204);
    }
    next();
});

const ai = new GoogleGenAI({});

app.post("/define", async (req, res) => {
    const { text, word, sourceLang, surroundingText } = req.body;
    const queryText = text || word;

    try {
        const prompt = [
            "You are a helpful dictionary assistant.",
            "Provide a clear definition and two example sentences for the word/phrase.",
            "IMPORTANT: The first definition must be based on the context provided.",
            "Then provide 2-3 additional popular use cases.",
            "Use simple, clear language.",
            `Word/Phrase: "${queryText}"`,
            sourceLang ? `Language: ${sourceLang}` : "",
            surroundingText ? `Context: ${surroundingText}` : "",
            "Format your response as:",
            "Definition: [context-based definition first]",
            "Popular uses: [2-3 additional common meanings/uses]",
            "Example 1: [first example sentence]",
            "Example 2: [second example sentence]"
        ].filter(Boolean).join("\n");

        // Виклик Gemini API через SDK
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // або інша модель
            contents: prompt,
        });

        const definition = response.text || "No definition found";
        console.log("Gemini response:", response);
        res.json({ definition });
    } catch (error) {
        console.error("Gemini request error:", error);
        res.status(500).json({ error: "Failed to fetch definition" });
    }
});

app.post("/explain", async (req, res) => {
    const { text, sourceLang, targetLang, surroundingText } = req.body;

    try {
        console.log("Explain request:", { text, sourceLang, targetLang, surroundingText });
        
        const prompt = [
            "You are a friendly native-speaker friend.",
            "Give a short, warm explanation of the word/phrase in context.",
            "Focus on meaning and usage, not a dictionary entry.",
            "Use simple, natural language.",
            "One or two compact sentences max.",
            "Avoid phonetics and formatting; no bullet points.",
            `Word/Phrase: "${text}" (source language: ${ sourceLang || "unknown"})`,
            surroundingText ? `Context sentence: ${surroundingText}` : "",
            targetLang ? `Respond in ${sourceLang} language.` : "",
        ].filter(Boolean).join("\n");

        console.log("Explain prompt:", prompt);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const explanation = response.text || "";
        console.log("Explain response:", explanation);
        res.json({ explanation });
    } catch (error) {
        console.error("Gemini request error:", error);
        res.status(500).json({ error: "Failed to generate explanation" });
    }
});

app.post("/synonyms", async (req, res) => {
    const { text, sourceLang, surroundingText } = req.body;

    try {
        const prompt = [
            "You are a helpful thesaurus assistant.",
            "Provide 5-8 synonyms for the given word/phrase.",
            "Include words that are commonly used and appropriate for the context.",
            "Format as a simple comma-separated list.",
            "Do not include the original word in the list.",
            `Word/Phrase: "${text}" (language: ${sourceLang || "unknown"})`,
            surroundingText ? `Context: ${surroundingText}` : "",
            "Respond with only the synonyms, separated by commas.",
        ].filter(Boolean).join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const synonymsText = response.text || "";
        const synonyms = synonymsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        res.json({ synonyms });
    } catch (error) {
        console.error("Gemini request error:", error);
        res.status(500).json({ error: "Failed to fetch synonyms" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
