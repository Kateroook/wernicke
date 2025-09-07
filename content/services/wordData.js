export class WordData {
    constructor(text, sourceLanguage, surroundingText = null) {
        this.id = this.generateId();
        this.text = text;
        this.sourceLanguage = sourceLanguage;
        this.timestamp = new Date().toISOString();
        
        // Core data
        this.translation = {
            targetLanguage: null,
            translatedText: null,
            confidence: null
        };
        
        this.pronunciation = {
            phonetic: null,
            audioUrl: null,
            hasSpeechSynthesis: false
        };
        
        this.definition = {
            definitions: [],
            partOfSpeech: null,
            etymology: null,
            examples: []
        };
        
        this.explanation = {
            targetLanguage: null,
            text: null
        };
        
        this.synonyms = [];
        this.antonyms = [];
        
        // Learning integration
        this.learningData = {
            addedToWordList: false,
            difficulty: null,
            masteryLevel: 0,
            lastReviewed: null,
            reviewCount: 0
        };
        
        // Context
        this.context = {
            sourceUrl: window.location.href,
            surroundingText: surroundingText,
            domain: window.location.hostname
        };
    }
    
    generateId() {
        return `${this.text}_${this.sourceLanguage}_${Date.now()}`;
    }
    
    updateTranslation(targetLang, translatedText, confidence = null) {
        this.translation = {
            targetLanguage: targetLang,
            translatedText,
            confidence
        };
    }
    
    updateDefinition(definitions, partOfSpeech = null) {
        this.definition = {
            definitions: definitions || [],
            partOfSpeech,
            examples: (definitions || []).flatMap(def => def.examples || [])
        };
    }
    
    updatePronunciation(phonetic, audioUrl = null, hasSpeechSynthesis = false) {
        this.pronunciation = {
            phonetic,
            audioUrl,
            hasSpeechSynthesis
        };
    }
    
    updateExplanation(targetLanguage, text) {
        this.explanation = {
            targetLanguage,
            text
        };
    }
    
    updateSynonyms(synonyms) {
        this.synonyms = synonyms || [];
    }
    
    addToWordList() {
        this.learningData.addedToWordList = true;
        this.learningData.lastReviewed = new Date().toISOString();
    }
    
    removeFromWordList() {
        this.learningData.addedToWordList = false;
    }
    
    // Serialize for storage
    toJSON() {
        return {
            id: this.id,
            text: this.text,
            sourceLanguage: this.sourceLanguage,
            timestamp: this.timestamp,
            translation: this.translation,
            pronunciation: this.pronunciation,
            definition: this.definition,
            explanation: this.explanation,
            synonyms: this.synonyms,
            antonyms: this.antonyms,
            learningData: this.learningData,
            context: this.context
        };
    }
    
    // Deserialize from storage
    static fromJSON(data) {
        const wordData = new WordData(data.text, data.sourceLanguage);
        Object.assign(wordData, data);
        return wordData;
    }
}

export class WordManager {
    constructor() {
        this.words = new Map();
        this.loadFromStorage();
    }
    
    async saveWord(wordData) {
        this.words.set(wordData.id, wordData);
        await this.saveToStorage();
        return wordData;
    }
    
    getWord(id) {
        return this.words.get(id);
    }
    
    getWordsForLearning() {
        return Array.from(this.words.values())
            .filter(word => word.learningData.addedToWordList);
    }
    
    getAllWords() {
        return Array.from(this.words.values());
    }
    
    async loadFromStorage() {
        try {
            const result = await chrome.storage.local.get(['savedWords']);
            if (result.savedWords) {
                result.savedWords.forEach(wordData => {
                    const word = WordData.fromJSON(wordData);
                    this.words.set(word.id, word);
                });
            }
        } catch (error) {
            console.error('Failed to load words from storage:', error);
        }
    }
    
    async saveToStorage() {
        try {
            const wordsArray = Array.from(this.words.values()).map(word => word.toJSON());
            await chrome.storage.local.set({ savedWords: wordsArray });
        } catch (error) {
            console.error('Failed to save words to storage:', error);
        }
    }
    
    async exportToLearningApp() {
        const learningWords = this.getWordsForLearning();
        // This would integrate with your learning app
        console.log('Exporting words to learning app:', learningWords);
        return learningWords;
    }
    
    // Remove empty cached entries
    async cleanupEmptyEntries() {
        const wordsToRemove = [];
        
        for (const [id, word] of this.words.entries()) {
            const hasTranslation = !!word.translation?.translatedText;
            const hasDefinition = word.definition?.definitions?.length > 0;
            const hasExplanation = !!word.explanation?.text;
            const hasSynonyms = word.synonyms?.length > 0;
            
            // If word has no content at all, mark for removal
            if (!hasTranslation && !hasDefinition && !hasExplanation && !hasSynonyms) {
                wordsToRemove.push(id);
            }
        }
        
        // Remove empty entries
        wordsToRemove.forEach(id => this.words.delete(id));
        
        if (wordsToRemove.length > 0) {
            console.log(`Cleaned up ${wordsToRemove.length} empty cached entries`);
            await this.saveToStorage();
        }
    }
}

