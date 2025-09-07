(()=>{async function w(e,n,o){try{let t=e.toLowerCase(),i=await Translator.create({sourceLanguage:t.toLowerCase(),targetLanguage:o.toLowerCase()}),r=await i.translate(n);return i.destroy(),r||"[No translation]"}catch(t){return console.error("Translation failed:",t),"[No translation]"}}async function b(e){try{let n=await LanguageDetector.create(),o=await n.detect(e);return o&&o.length>0?(console.log("Detected language:",o[0].detectedLanguage),o[0].detectedLanguage.toUpperCase()):(n.destroy(),"EN")}catch(n){return console.error("Language detection failed:",n),"EN"}}async function R(e,n="EN",o=null){return new Promise((t,i)=>{chrome.runtime.sendMessage({type:"DEFINE",word:e,sourceLang:n,surroundingText:o},r=>{if(!r){i(new Error("No response from background"));return}r.error?i(new Error(r.error)):t(r.data)})})}async function N({text:e,sourceLang:n,targetLang:o,surroundingText:t}){return new Promise((i,r)=>{chrome.runtime.sendMessage({type:"EXPLAIN",text:e,sourceLang:n,targetLang:o,surroundingText:t},s=>{if(!s){r(new Error("No response from background"));return}s.error?r(new Error(s.error)):i(s.data)})})}async function P({text:e,sourceLang:n,surroundingText:o}){return new Promise((t,i)=>{chrome.runtime.sendMessage({type:"SYNONYMS",text:e,sourceLang:n,surroundingText:o},r=>{if(!r){i(new Error("No response from background"));return}r.error?i(new Error(r.error)):t(r.data)})})}var x=class e{constructor(n,o,t=null){this.id=this.generateId(),this.text=n,this.sourceLanguage=o,this.timestamp=new Date().toISOString(),this.translation={targetLanguage:null,translatedText:null,confidence:null},this.pronunciation={phonetic:null,audioUrl:null,hasSpeechSynthesis:!1},this.definition={definitions:[],partOfSpeech:null,etymology:null,examples:[]},this.explanation={targetLanguage:null,text:null},this.synonyms=[],this.antonyms=[],this.learningData={addedToWordList:!1,difficulty:null,masteryLevel:0,lastReviewed:null,reviewCount:0},this.context={sourceUrl:window.location.href,surroundingText:t,domain:window.location.hostname}}generateId(){return`${this.text}_${this.sourceLanguage}_${Date.now()}`}updateTranslation(n,o,t=null){this.translation={targetLanguage:n,translatedText:o,confidence:t}}updateDefinition(n,o=null){this.definition={definitions:n||[],partOfSpeech:o,examples:(n||[]).flatMap(t=>t.examples||[])}}updatePronunciation(n,o=null,t=!1){this.pronunciation={phonetic:n,audioUrl:o,hasSpeechSynthesis:t}}updateExplanation(n,o){this.explanation={targetLanguage:n,text:o}}updateSynonyms(n){this.synonyms=n||[]}addToWordList(){this.learningData.addedToWordList=!0,this.learningData.lastReviewed=new Date().toISOString()}removeFromWordList(){this.learningData.addedToWordList=!1}toJSON(){return{id:this.id,text:this.text,sourceLanguage:this.sourceLanguage,timestamp:this.timestamp,translation:this.translation,pronunciation:this.pronunciation,definition:this.definition,explanation:this.explanation,synonyms:this.synonyms,antonyms:this.antonyms,learningData:this.learningData,context:this.context}}static fromJSON(n){let o=new e(n.text,n.sourceLanguage);return Object.assign(o,n),o}},f=class{constructor(){this.words=new Map,this.loadFromStorage()}async saveWord(n){return this.words.set(n.id,n),await this.saveToStorage(),n}getWord(n){return this.words.get(n)}getWordsForLearning(){return Array.from(this.words.values()).filter(n=>n.learningData.addedToWordList)}getAllWords(){return Array.from(this.words.values())}async loadFromStorage(){try{let n=await chrome.storage.local.get(["savedWords"]);n.savedWords&&n.savedWords.forEach(o=>{let t=x.fromJSON(o);this.words.set(t.id,t)})}catch(n){console.error("Failed to load words from storage:",n)}}async saveToStorage(){try{let n=Array.from(this.words.values()).map(o=>o.toJSON());await chrome.storage.local.set({savedWords:n})}catch(n){console.error("Failed to save words to storage:",n)}}async exportToLearningApp(){let n=this.getWordsForLearning();return console.log("Exporting words to learning app:",n),n}async cleanupEmptyEntries(){var o,t,i,r,s;let n=[];for(let[a,c]of this.words.entries()){let l=!!((o=c.translation)!=null&&o.translatedText),d=((i=(t=c.definition)==null?void 0:t.definitions)==null?void 0:i.length)>0,u=!!((r=c.explanation)!=null&&r.text),p=((s=c.synonyms)==null?void 0:s.length)>0;!l&&!d&&!u&&!p&&n.push(a)}n.forEach(a=>this.words.delete(a)),n.length>0&&(console.log(`Cleaned up ${n.length} empty cached entries`),await this.saveToStorage())}};async function v(e){return"speechSynthesis"in window?(await new Promise(o=>{let t=speechSynthesis.getVoices();if(t.length)return o(t);speechSynthesis.onvoiceschanged=()=>o(speechSynthesis.getVoices())})).some(o=>o.lang.toLowerCase().startsWith(e.toLowerCase())):!1}var I=new f;function T(e){var r;let n=e.lastSelectedTextRef.value,o=e.menuBoxRef.value,t=(r=e.lastSurroundingTextRef)==null?void 0:r.value;if(!o)return;if(!n||n.trim()===""){console.error("No text selected for synonyms menu");return}let i=new x(n,"EN",t);console.log("Synonyms Word data",i),E(i,e,!0),J(i).then(()=>{E(i,e,!1)}).catch(s=>{console.error("Failed to load word data:",s),E(i,e,!1,s)})}async function J(e){var n;try{let o=I.getAllWords(),t=o.find(r=>r.text===e.text&&r.context.sourceUrl===e.context.sourceUrl);if(!t){let r=new URL(e.context.sourceUrl).hostname;t=o.find(s=>s.text===e.text&&new URL(s.context.sourceUrl).hostname===r)}if(t)if(((n=t.synonyms)==null?void 0:n.length)>0){console.log("Using cached word data for synonyms:",e.text);let s=e.id,a=e.timestamp,c=e.context.surroundingText;Object.assign(e,t),e.id=s,e.timestamp=a,e.context.surroundingText=c;return}else console.log("Cached synonyms data is empty, loading fresh data for:",e.text);console.log("Loading new word data for synonyms:",e.text);let i=await b(e.text);e.sourceLanguage=i,await X(e),await Y(e),await I.saveWord(e)}catch(o){throw console.error("Error loading word data:",o),o}}async function X(e){let n=await v(e.sourceLanguage);e.updatePronunciation(null,null,n)}async function Y(e){try{let n=await P({text:e.text,sourceLang:e.sourceLanguage,surroundingText:e.context.surroundingText}),o=(n==null?void 0:n.synonyms)||[];e.updateSynonyms(o)}catch(n){console.error("Failed to load synonyms:",n),e.updateSynonyms([])}}function E(e,n,o=!1,t=null){let i=n.menuBoxRef.value;if(!i)return;let r=e.learningData.addedToWordList;i.innerHTML=`
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
        ">
            <!-- Top horizontal menu -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            ">
                <button style="
                    background: #0057d8;
                    color: white;
                    font-weight: bold;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    line-height: 32px;
                    cursor: default;
                ">Synonyms</button>

                <button id="addCardBtn" style="
                    background: ${r?"#28a745":"white"};
                    color: ${r?"white":"#0057d8"};
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                ">${r?"\u2713":"+"}</button>
                
                <button id="translateBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    margin-left: auto;
                ">Translate</button>

                <button id="definitionBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                ">Definition</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="font-size: 20px; font-weight: bold;">
                    ${e.text}
                    ${e.pronunciation.hasSpeechSynthesis?'<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>':""}
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">
                    ${e.pronunciation.phonetic||""}
                </div>
            </div>
            
            <!-- Synonyms section -->
            <div id="synonymsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 10px;">Synonyms:</div>
                <div id="synonymsList" style="font-size: 14px; line-height: 1.6;">
                    ${o?'<div style="color: #ccc;">Loading synonyms...</div>':t?'<div style="color: #ff6b6b;">Error loading synonyms</div>':V(e.synonyms)}
                </div>
            </div>
            
            <!-- Learning info -->
            ${e.learningData.addedToWordList?`
                <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
                    \u2713 Added to word list for learning
                </div>
            `:""}
        </div>
    `,q(e,n)}function V(e){return!e||e.length===0?'<div style="color: #ccc;">No synonyms found.</div>':e.map(n=>`<span style="
            background: rgba(255,255,255,0.2);
            padding: 4px 8px;
            margin: 3px;
            border-radius: 6px;
            display: inline-block;
            font-size: 13px;
            cursor: pointer;
            transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.backgroundColor='rgba(255,255,255,0.2)'"
           onclick="selectSynonym('${n}')">${n}</span>`).join("")}function q(e,n){let o=document.getElementById("translateBtn");o&&(o.onclick=s=>{s.stopPropagation(),n.lastSelectedTextRef.value=e.text,h(n)});let t=document.getElementById("definitionBtn");t&&(t.onclick=s=>{s.stopPropagation(),n.lastSelectedTextRef.value=e.text,S(n)});let i=document.getElementById("addCardBtn");i&&(i.onclick=async s=>{s.stopPropagation(),e.learningData.addedToWordList?e.removeFromWordList():e.addToWordList(),await I.saveWord(e),E(e,n,!1)});let r=document.getElementById("playPronunciation");r&&(r.onclick=()=>{if(e.pronunciation.hasSpeechSynthesis){let s=new SpeechSynthesisUtterance(e.text);s.lang=e.sourceLanguage.toLowerCase(),speechSynthesis.speak(s)}}),window.selectSynonym=s=>{n.lastSelectedTextRef.value=s,h(n)}}var U=new f;function S(e){var r;let n=e.lastSelectedTextRef.value,o=e.menuBoxRef.value,t=(r=e.lastSurroundingTextRef)==null?void 0:r.value;if(!o)return;if(!n||n.trim()===""){console.error("No text selected for definition menu");return}let i=new x(n,"EN",t);console.log("Word data",i),B(i,e,!0),G(i).then(()=>{B(i,e,!1)}).catch(s=>{console.error("Failed to load word data:",s),B(i,e,!1,s)})}async function G(e){var n,o;try{let t=U.getAllWords(),i=t.find(s=>s.text===e.text&&s.context.sourceUrl===e.context.sourceUrl);if(!i){let s=new URL(e.context.sourceUrl).hostname;i=t.find(a=>a.text===e.text&&new URL(a.context.sourceUrl).hostname===s)}if(i)if(((o=(n=i.definition)==null?void 0:n.definitions)==null?void 0:o.length)>0){console.log("Using cached word data for definition:",e.text);let a=e.id,c=e.timestamp,l=e.context.surroundingText;Object.assign(e,i),e.id=a,e.timestamp=c,e.context.surroundingText=l;return}else console.log("Cached definition data is empty, loading fresh data for:",e.text);console.log("Loading new word data for definition:",e.text);let r=await b(e.text);e.sourceLanguage=r,await Q(e),await Z(e),await U.saveWord(e)}catch(t){throw console.error("Error loading word data:",t),t}}async function Q(e){var n,o,t,i;if(e.sourceLanguage==="EN")try{let r=await R(e.text);if(r){let s=((o=(n=r.phonetics)==null?void 0:n.find(c=>c.text))==null?void 0:o.text)||"",a=((i=(t=r.phonetics)==null?void 0:t.find(c=>c.audio))==null?void 0:i.audio)||null;e.updatePronunciation(s,a)}}catch(r){console.error("Failed to load pronunciation from API:",r)}if(!e.pronunciation.audioUrl){let r=await v(e.sourceLanguage);e.updatePronunciation(e.pronunciation.phonetic,null,r)}}async function Z(e){try{let n=await R(e.text,e.sourceLanguage,e.context.surroundingText),o=(n==null?void 0:n.definition)||"",t=D(o);e.updateDefinition(t)}catch(n){console.error("Failed to load definitions:",n),e.updateDefinition([])}}function D(e){if(!e)return[];let n=e.split(`
`).filter(r=>r.trim()),o=[],t=null,i="";for(let r of n){let s=r.trim();if(s.startsWith("Definition:"))t&&o.push(t),t={definition:s.replace("Definition:","").trim(),examples:[]};else if(s.startsWith("Popular uses:"))i=s.replace("Popular uses:","").trim(),t&&i&&(t.definition+=`

Popular uses: ${i}`);else if((s.startsWith("Example 1:")||s.startsWith("Example 2:"))&&t){let a=s.replace(/^Example \d+:/,"").trim();a&&t.examples.push(a)}}return t&&o.push(t),o}function B(e,n,o=!1,t=null){let i=n.menuBoxRef.value;if(!i)return;let r=e.learningData.addedToWordList;i.innerHTML=`
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
        ">
            <!-- Top horizontal menu -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            ">
                <button style="
                    background: #0057d8;
                    color: white;
                    font-weight: bold;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    line-height: 32px;
                    cursor: default;
                ">Definition</button>          

                <button id="addCardBtn" style="
                    background: ${r?"#28a745":"white"};
                    color: ${r?"white":"#0057d8"};
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                ">${r?"\u2713":"+"}</button>
                
                <button id="translateBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    margin-left: auto;
                ">Translate</button>

                <button id="showSynonymsBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    margin-left: auto;
                ">Synonyms</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="font-size: 20px; font-weight: bold;">
                    ${e.text}
                    ${e.pronunciation.audioUrl||e.pronunciation.hasSpeechSynthesis?'<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>':""}
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">
                    ${e.pronunciation.phonetic||""}
                </div>
            </div>
            
            <!-- Definitions section -->
            <div id="definitionsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 5px;">Definitions:</div>
                <div id="definitionList" style="font-size: 14px;">
                    ${o?'<div style="color: #ccc;">Loading...</div>':t?'<div style="color: #ff6b6b;">Error loading definitions</div>':ee(e.definition.definitions)}
                </div>
            </div>
            
            <!-- Learning info -->
            ${e.learningData.addedToWordList?`
                <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
                    \u2713 Added to word list for learning
                </div>
            `:""}
        </div>
    `,ne(e,n)}function ee(e){return e.length===0?'<div style="color: #ccc;">No definitions found.</div>':e.map((n,o)=>{let t=n.examples&&n.examples.length>0?`<ul style="margin: 5px 0 10px 20px; padding: 0; color: #ddd;">
                ${n.examples.map(i=>`<li style="margin-bottom: 3px;">${i}</li>`).join("")}
               </ul>`:"";return`
            <div style="margin-bottom: 10px;">
                <div><b>${o+1}.</b> ${n.definition}</div>
                ${t}
            </div>
        `}).join("")}function ne(e,n){let o=document.getElementById("translateBtn");o&&(o.onclick=s=>{s.stopPropagation(),n.lastSelectedTextRef.value=e.text,h(n)});let t=document.getElementById("addCardBtn");t&&(t.onclick=async s=>{s.stopPropagation(),e.learningData.addedToWordList?e.removeFromWordList():e.addToWordList(),await U.saveWord(e),B(e,n,!1)});let i=document.getElementById("playPronunciation");i&&(i.onclick=()=>{if(e.pronunciation.audioUrl)new Audio(e.pronunciation.audioUrl).play();else if(e.pronunciation.hasSpeechSynthesis){let s=new SpeechSynthesisUtterance(e.text);s.lang=e.sourceLanguage.toLowerCase(),speechSynthesis.speak(s)}});let r=document.getElementById("showSynonymsBtn");r&&(r.onclick=s=>{s.stopPropagation(),n.lastSelectedTextRef.value=e.text,T(n)})}var m=new f;function h(e){var r;let n=e.lastSelectedTextRef.value,o=e.menuBoxRef.value,t=(r=e.lastSurroundingTextRef)==null?void 0:r.value;if(console.log("showTranslateMenu - lastSelectedText:",n),console.log("showTranslateMenu - surroundingText:",t),!o)return;if(!n||n.trim()===""){console.error("No text selected for translate menu");return}let i=new x(n,"EN",t);console.log("Translate Word data",i),k(i,e,!0),te(i).then(()=>{k(i,e,!1)}).catch(s=>{console.error("Failed to load word data:",s),k(i,e,!1,s)})}async function te(e){var n,o,t,i,r;try{let s=m.getAllWords();console.log("Cache lookup - searching for:",e.text,"on URL:",e.context.sourceUrl),console.log("Cache lookup - available words:",s.map(d=>({text:d.text,url:d.context.sourceUrl})));let a=s.find(d=>d.text===e.text&&d.context.sourceUrl===e.context.sourceUrl);if(!a){let d=new URL(e.context.sourceUrl).hostname;a=s.find(u=>u.text===e.text&&new URL(u.context.sourceUrl).hostname===d)}if(a){let d=!!((n=a.translation)!=null&&n.translatedText),u=((t=(o=a.definition)==null?void 0:o.definitions)==null?void 0:t.length)>0,p=!!((i=a.explanation)!=null&&i.text),g=((r=a.synonyms)==null?void 0:r.length)>0;if(console.log("Cached data check:",{hasTranslation:d,hasDefinition:u,hasExplanation:p,hasSynonyms:g,translation:a.translation,definition:a.definition,explanation:a.explanation,synonyms:a.synonyms}),d||u||p||g){console.log("Using cached word data for:",e.text);let C=e.id,L=e.timestamp,y=e.context.surroundingText;if(Object.assign(e,a),e.id=C,e.timestamp=L,e.context.surroundingText=y,d||(console.log("Loading fresh translation for cached word:",e.text),await F(e)),!p){console.log("Loading fresh explanation for cached word:",e.text);let j=e.sourceLanguage==="UK"?"EN":"UK";await W(e,j)}await m.saveWord(e);return}else console.log("Cached data is empty, loading fresh data for:",e.text)}console.log("No cached data found for:",e.text),console.log("Loading new word data for:",e.text),await m.cleanupEmptyEntries();let c=await b(e.text);e.sourceLanguage=c,await oe(e),await F(e);let l=e.sourceLanguage==="UK"?"EN":"UK";await W(e,l),await m.saveWord(e)}catch(s){throw console.error("Error loading word data:",s),s}}async function oe(e){let n=await v(e.sourceLanguage);e.updatePronunciation(null,null,n)}async function F(e){try{let n="UK";e.sourceLanguage==="UK"&&(n="EN");let o=await w(e.sourceLanguage,e.text,n);e.updateTranslation(n,o)}catch(n){console.error("Failed to load initial translation:",n);let o=e.sourceLanguage==="UK"?"EN":"UK";e.updateTranslation(o,"Translation failed")}}async function W(e,n){var o,t;try{console.log("Loading explanation:",{text:e.text,sourceLang:e.sourceLanguage,targetLang:n,surroundingText:(o=e==null?void 0:e.context)==null?void 0:o.surroundingText});let i=await N({text:e.text,sourceLang:e.sourceLanguage,targetLang:n,surroundingText:((t=e==null?void 0:e.context)==null?void 0:t.surroundingText)||null}),r=(i==null?void 0:i.explanation)||"";console.log("Explanation received:",r),e.updateExplanation(n,r)}catch(i){console.error("Failed to load friendly explanation:",i),e.updateExplanation(n,"")}}function k(e,n,o=!1,t=null){let i=n.menuBoxRef.value;if(!i)return;let r=e.learningData.addedToWordList,s=e.translation.translatedText||"...",a=e.explanation.text||"";i.innerHTML=`
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 400px;
            max-width: 400px;
            min-width: 400px;
        ">
            <!-- Top horizontal menu -->
            <div style="
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
                width: 100%;
                box-sizing: border-box;
            ">
                <button style="
                    background: #0057d8;
                    color: white;
                    font-weight: bold;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    line-height: 32px;
                    cursor: default;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Translate</button>

                <select id="fromLang" style="
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    font-size: 14px;
                    padding: 0 8px;
                    appearance: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <option value="EN">EN</option>
                    <option value="UK">UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

                <span id="swapLangs" style="
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 32px;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">\u2194</span>

                <select id="toLang" style="
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    height: 32px;
                    padding: 0 8px;
                    appearance: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">
                    <option value="EN" ${e.sourceLanguage==="UK"?"selected":""}>EN</option>
                    <option value="UK" ${e.sourceLanguage!=="UK"?"selected":""}>UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

                <button id="addCardBtn" style="
                    background: ${r?"#28a745":"white"};
                    color: ${r?"white":"#0057d8"};
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">${r?"\u2713":"+"}</button>

                <button id="showSynonymsBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 8px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    margin-left: auto;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Synonyms</button>

                <button id="showDefinitionBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                    line-height: 32px;
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                ">Definition</button>
            </div>

            <!-- Word display -->
            <div style="margin-bottom: 10px;">
                <div id="sourceTextDisplay" style="
                    font-size: 20px; 
                    font-weight: bold;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-width: 100%;
                    box-sizing: border-box;
                ">
                    ${e.text}
                    ${e.pronunciation.hasSpeechSynthesis?'<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>':""}
                </div>
                <div id="pronunciationText" style="
                    color: #ccc; 
                    font-size: 14px;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-width: 100%;
                    box-sizing: border-box;
                ">
                    ${e.pronunciation.phonetic||""}
                </div>
            </div>

            <!-- Translation -->
            <div style="
                background: white;
                color: #0057d8;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 12px;
                max-width: 100%;
                word-wrap: break-word;
                overflow-wrap: break-word;
                box-sizing: border-box;
            " id="translatedText">
                ${o?"Loading...":s}
            </div>
            
            <!-- Friendly explanation -->
            <div id="friendlyExplanation" style="
                color: #ffffff;
                opacity: 0.95;
                font-size: 14px;
                line-height: 1.4;
                background: rgba(255,255,255,0.1);
                border-radius: 6px;
                padding: 8px 10px;
                margin-top: 6px;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                max-width: 100%;
                box-sizing: border-box;
            ">
                ${o?"":a||""}
            </div>
            
            <!-- Learning info -->
            ${e.learningData.addedToWordList?`
                <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
                    \u2713 Added to word list for learning
                </div>
            `:""}
        </div>
    `,ie(e,n)}function ie(e,n){let o=document.getElementById("fromLang");o&&(o.value=e.sourceLanguage);let t=document.getElementById("addCardBtn");t&&(t.onclick=async l=>{l.stopPropagation(),e.learningData.addedToWordList?e.removeFromWordList():e.addToWordList(),await m.saveWord(e),k(e,n,!1)});let i=document.getElementById("playPronunciation");i&&(i.onclick=()=>{if(e.pronunciation.hasSpeechSynthesis){let l=new SpeechSynthesisUtterance(e.text);l.lang=e.sourceLanguage.toLowerCase(),speechSynthesis.speak(l)}});let r=document.getElementById("toLang");r&&r.addEventListener("change",async()=>{let l=r.value,d=document.getElementById("fromLang").value,u=document.getElementById("translatedText"),p=document.getElementById("friendlyExplanation");if(u){u.textContent="Loading...",p&&(p.textContent="");try{let g=await w(d,e.text,l);e.updateTranslation(l,g),u.textContent=g,await W(e,l),p&&(p.textContent=e.explanation.text||""),await m.saveWord(e)}catch(g){u.textContent="Translation failed",console.error("Translation error:",g)}}});let s=document.getElementById("swapLangs");s&&(s.onclick=async()=>{let l=document.getElementById("fromLang"),d=document.getElementById("toLang"),u=document.getElementById("translatedText"),p=document.getElementById("sourceTextDisplay"),g=document.getElementById("friendlyExplanation");if(!l||!d||!u||!p)return;let C=l.value;l.value=d.value,d.value=C;let L=u.textContent.trim();e.text=L,e.sourceLanguage=l.value,p.innerHTML=`${L} ${e.pronunciation.hasSpeechSynthesis?'<span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>':""}`,u.textContent="Loading...",g&&(g.textContent="");try{let y=await w(l.value,L,d.value);e.updateTranslation(d.value,y),u.textContent=y,await W(e,d.value),g&&(g.textContent=e.explanation.text||""),await m.saveWord(e)}catch(y){u.textContent="Translation failed",console.error("Translation error:",y)}});let a=document.getElementById("showDefinitionBtn");a&&(a.onclick=l=>{l.stopPropagation(),n.lastSelectedTextRef.value=e.text,S(n)});let c=document.getElementById("showSynonymsBtn");c&&(c.onclick=l=>{l.stopPropagation(),n.lastSelectedTextRef.value=e.text,T(n)})}function A(e,n,o){M(o),console.log("Show menu");let t=document.createElement("div");t.id="helper-menu",t.style.position="absolute",t.style.left=`${e}px`,t.style.top=`${n+25}px`,t.style.zIndex=9999,document.body.appendChild(t),o.menuBoxRef.value=t,console.log("Menu appended to body",t),re(o)}function M(e){let n=e.menuBoxRef.value;n&&n.parentNode&&(n.parentNode.removeChild(n),e.menuBoxRef.value=null)}function re(e){let n=e.menuBoxRef.value;n&&(n.innerHTML=`
        <div style="
            display: flex;
            gap: 8px;
            background: #0057d8;
            border-radius: 12px;
            padding: 10px 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ">
            <button id="addCardBtn" class="menu-btn">+</button>
            <button id="translateBtn" class="menu-btn">Translate</button>
            <button id="synonymsBtn" class="menu-btn">Synonyms</button>
            <button id="meaningBtn" class="menu-btn">Definition</button>
        </div>
    `,se(),document.getElementById("translateBtn").onclick=o=>{o.stopPropagation(),h(e)},document.getElementById("synonymsBtn").onclick=o=>{o.stopPropagation(),T(e)},document.getElementById("meaningBtn").onclick=o=>{o.stopPropagation(),S(e)})}function se(){document.querySelectorAll(".menu-btn").forEach(e=>{e.style.cssText=`
            background: white;
            color: #0057d8;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            min-width: 80px;
        `})}function O(e,n,o){z(o);let t=document.createElement("div");t.className="helper-icon";let i=chrome.runtime.getURL("../assets/wernicke_logo_big.png");t.style.backgroundImage=`url(${i})`,t.style.position="absolute",t.style.left=`${e+10}px`,t.style.top=`${n+30}px`,t.style.width="32px",t.style.height="32px",t.style.backgroundSize="cover",t.style.cursor="pointer",t.style.zIndex=9999,t.addEventListener("click",r=>{console.log("Icon clicked"),r.stopPropagation(),A(e,n,o)}),document.body.appendChild(t),o.helperIconRef.value=t}function z(e){let n=e.helperIconRef.value;n&&n.parentNode&&(n.parentNode.removeChild(n),e.helperIconRef.value=null)}function H(e){let n=window.getSelection(),o=n.toString().trim();if(!o){e.pendingSelectionRef.value=null;return}let t=n.getRangeAt(0),i=t.getBoundingClientRect(),r=ae(t,o);console.log("Setting pending selection with surrounding text:",r),e.pendingSelectionRef.value={text:o,x:i.left+window.scrollX,y:i.top+window.scrollY,surroundingText:r}}function ae(e,n){var o;try{console.log("getSurroundingText called with:",{selectedText:n,range:e});let t="";if(e.commonAncestorContainer){let c=e.commonAncestorContainer;console.log("Container type:",c.nodeType,"Container:",c),c.nodeType===Node.TEXT_NODE?(t=c.textContent||"",console.log("Text node content:",t)):(t=c.textContent||"",console.log("Element node content:",t))}if(!t){console.log("No text from container, trying selection...");let c=window.getSelection();if(c.rangeCount>0){let l=c.getRangeAt(0).commonAncestorContainer;console.log("Selection container type:",l.nodeType,"Container:",l),l.nodeType===Node.TEXT_NODE?(t=((o=l.parentElement)==null?void 0:o.textContent)||l.textContent||"",console.log("Selection text node content:",t)):(t=l.textContent||"",console.log("Selection element node content:",t))}}if(!t)return console.log("No text content found"),null;let i=t.indexOf(n);if(console.log("Selected text index:",i),i===-1)return console.log("Selected text not found in content"),null;let r=Math.max(0,i-50),s=Math.min(t.length,i+n.length+50),a=t.substring(r,s).trim();return console.log("Captured surrounding text:",a),a}catch(t){return console.error("Error capturing surrounding text:",t),null}}function K(e){setTimeout(()=>{let n=e.pendingSelectionRef.value;n&&n.text!==e.lastSelectedTextRef.value&&(e.lastSelectedTextRef.value=n.text,e.lastSurroundingTextRef=e.lastSurroundingTextRef||{value:null},e.lastSurroundingTextRef.value=n.surroundingText,O(n.x,n.y,e))},10)}function _(e,n){let o=n.helperIconRef.value,t=n.menuBoxRef.value,i=t&&t.contains(e.target),r=o&&o.contains(e.target);!i&&!r&&(M(n),z(n),n.lastSelectedTextRef.value="")}var le=null,ce=null,de="",ue=null,pe=null,$={helperIconRef:{value:le},menuBoxRef:{value:ce},lastSelectedTextRef:{value:de},pendingSelectionRef:{value:ue},lastSurroundingTextRef:{value:pe}};document.addEventListener("selectionchange",()=>H($));document.addEventListener("mouseup",()=>K($));document.addEventListener("click",e=>_(e,$));})();
