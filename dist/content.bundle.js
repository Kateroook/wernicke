(()=>{async function h(t,e,o){try{let n=t.toLowerCase(),i=await Translator.create({sourceLanguage:n.toLowerCase(),targetLanguage:o.toLowerCase()}),r=await i.translate(e);return i.destroy(),r||"[No translation]"}catch(n){return console.error("Translation failed:",n),"[No translation]"}}async function y(t){try{let e=await LanguageDetector.create(),o=await e.detect(t);return o&&o.length>0?(console.log("Detected language:",o[0].detectedLanguage),o[0].detectedLanguage.toUpperCase()):(e.destroy(),"EN")}catch(e){return console.error("Language detection failed:",e),"EN"}}async function m(t){chrome.runtime.sendMessage({type:"DEFINE",word:t},e=>{e.error?console.error("Error:",e.error):console.log("Definition:",e.data)})}async function T(t){return"speechSynthesis"in window?(await new Promise(o=>{let n=speechSynthesis.getVoices();if(n.length)return o(n);speechSynthesis.onvoiceschanged=()=>o(speechSynthesis.getVoices())})).some(o=>o.lang.toLowerCase().startsWith(t.toLowerCase())):!1}async function f(t,e){var d,l;let o=document.getElementById("pronunciationText"),n=document.getElementById("playPronunciation"),i=null,r="",c=!1;if(e==="EN"){let a=await m(t);a&&(r=((d=a.phonetics.find(s=>s.text))==null?void 0:d.text)||"",i=((l=a.phonetics.find(s=>s.audio))==null?void 0:l.audio)||null,window._wordDetails===void 0&&(window._wordDetails=a))}i||(c=await T(e)),n&&(i||c?(n.style.display="inline",n.onclick=()=>{if(i)new Audio(i).play();else{let a=new SpeechSynthesisUtterance(t);a.lang=e.toLowerCase(),speechSynthesis.speak(a)}}):n.style.display="none"),o&&(o.textContent=r||"")}async function L(t,e){var n,i;let o=`https://${e}.wiktionary.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(t.toLowerCase())}&origin=*`;try{let c=await(await fetch(o)).json();if((i=(n=c==null?void 0:c.parse)==null?void 0:n.text)!=null&&i["*"]){let d=c.parse.text["*"],a=new DOMParser().parseFromString(d,"text/html"),s=[],g=a.querySelectorAll("ol > li");for(let x of g){let p=x.innerText.trim().split(`
`)[0];if(!p||p.length<5)continue;let S=[];if(x.querySelectorAll("ul li, blockquote").forEach(z=>{let u=z.innerText.trim();if(u.includes(":")){let M=u.lastIndexOf(":");u=u.slice(M+1).trim()}u=u.replace(/^["'–—-]+/,"").trim(),u.length>=3&&S.push(u)}),s.push({definition:p,examples:S}),s.length>=3)break}return s}}catch(r){return console.error("Wiktionary fetch error:",r),[]}}async function N(){try{let e=await m("example");console.log("Full Response:",e)}catch(t){console.error("Error:",t)}}function b(t){N();let e=t.lastSelectedTextRef.value,o=t.menuBoxRef.value;o&&(o.innerHTML=`
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width:400px;
        ">
            <!-- \u0412\u0435\u0440\u0445\u043D\u0454 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u0435 \u043C\u0435\u043D\u044E -->
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
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                ">+</button>
                
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

            <!-- \u0421\u043B\u043E\u0432\u043E -->
            <div style="margin-bottom: 10px;">
                <div  id="sourceTextDisplay"  style="font-size: 20px; font-weight: bold;">${e} 
                    <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">'pronunciation'</div>
            </div>
            
            <div id="definitionsSection" style="margin-top: 10px; color: white;">
                <div style="font-weight: bold; margin-bottom: 5px;">Definitions:</div>
                <div id="definitionList" style="font-size: 14px;"></div>
            </div>
        </div>
    `,console.log(m(e)),y(e).then(n=>(console.log("Detected language:",n),f(e,n).catch(console.error),L(e,n))).then(n=>{let i=document.getElementById("definitionList");i&&(n.length===0?i.innerHTML='<div style="color: #ccc;">No definitions found.</div>':i.innerHTML=n.map((r,c)=>{let d=r.examples.length>0?`<ul style="margin: 5px 0 10px 20px; padding: 0; color: #ddd;">
                        ${r.examples.map(l=>`<li style="margin-bottom: 3px;">${l}</li>`).join("")}
                       </ul>`:"";return`
                    <div style="margin-bottom: 10px;">
                        <div><b>${c+1}.</b> ${r.definition}</div>
                        ${d}
                    </div>
                `}).join(""))}).catch(n=>{let i=document.getElementById("definitionList");i&&(i.innerHTML='<div style="color: white;">Error fetching definition.</div>'),console.error("Definition or language detection failed:",n)}),document.getElementById("translateBtn").onclick=n=>{n.stopPropagation(),v(t)},document.getElementById("showSynonymsBtn").onclick=()=>alert("Show synonyms..."))}function v(t){let e=t.lastSelectedTextRef.value,o=t.menuBoxRef.value;y(e).then(n=>{let i=n||"EN";if(console.log("Detected language:",i),!o)return;o.innerHTML=`
        <div style="
            background-color: #0057d8;
            color: white;
            border-radius: 12px;
            padding: 15px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ">
            <!-- \u0412\u0435\u0440\u0445\u043D\u0454 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u0435 \u043C\u0435\u043D\u044E -->
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
                ">
                    <option value="EN" >EN</option>
                    <option value="UK" selected>UA</option>
                    <option value="DE">DE</option>
                    <option value="IT">IT</option>
                    <option value="FR">FR</option>
                </select>

                <button id="addCardBtn" style="
                    background: white;
                    color: #0057d8;
                    border: none;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 32px;
                ">+</button>

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
                ">Definition</button>
            </div>

            <!-- \u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0435\u043D\u0435 \u0441\u043B\u043E\u0432\u043E -->
            <div style="margin-bottom: 10px;">
                <div  id="sourceTextDisplay"  style="font-size: 20px; font-weight: bold;">${e} 
                    <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>
                </div>
                <div id="pronunciationText" style="color: #ccc; font-size: 14px;">'pronunciation'</div>
            </div>

            <!-- \u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 -->
            <div style="
                background: white;
                color: #0057d8;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 12px;
            " id="translatedText">
            ...
            </div>
        </div>
    `,document.getElementById("fromLang").value=i;let r=document.getElementById("toLang"),c=document.getElementById("translatedText"),d=document.getElementById("fromLang").value;if(r&&c){let l=r.value,a=d;c.textContent=`[${e} \u2192 ${l}]`,h(a,e,l).then(s=>{c.textContent=s})}f(e,d).catch(console.error),document.getElementById("swapLangs").onclick=async()=>{let l=document.getElementById("fromLang"),a=document.getElementById("toLang"),s=document.getElementById("translatedText"),g=document.getElementById("sourceTextDisplay");if(!l||!a||!s||!g)return;let x=l.value;l.value=a.value,a.value=x;let p=s.textContent.trim();t.lastSelectedTextRef.value=p,g.innerHTML=`${p} <span id="playPronunciation" style="font-size: 14px; cursor: pointer;">\u{1F50A}</span>`,s.textContent=await h(l.value,p,a.value),await f(p,l.value)},document.getElementById("toLang").addEventListener("change",()=>{let l=document.getElementById("toLang").value,a=document.getElementById("fromLang").value,s=document.getElementById("translatedText");s&&h(a,e,l).then(g=>{s.textContent=g})}),document.getElementById("showSynonymsBtn").onclick=()=>alert("Show synonyms..."),document.getElementById("showDefinitionBtn").onclick=l=>{l.stopPropagation(),b(t)}})}function I(t,e,o){w(o),console.log("Show menu");let n=document.createElement("div");n.id="helper-menu",n.style.position="absolute",n.style.left=`${t}px`,n.style.top=`${e+25}px`,n.style.zIndex=9999,document.body.appendChild(n),o.menuBoxRef.value=n,console.log("Menu appended to body",n),$(o)}function w(t){let e=t.menuBoxRef.value;e&&e.parentNode&&(e.parentNode.removeChild(e),t.menuBoxRef.value=null)}function $(t){let e=t.menuBoxRef.value;e&&(e.innerHTML=`
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
    `,H(),document.getElementById("translateBtn").onclick=o=>{o.stopPropagation(),v(t)},document.getElementById("synonymsBtn").onclick=()=>alert("Show synonyms..."),document.getElementById("meaningBtn").onclick=o=>{o.stopPropagation(),b(t)})}function H(){document.querySelectorAll(".menu-btn").forEach(t=>{t.style.cssText=`
            background: white;
            color: #0057d8;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            min-width: 80px;
        `})}function k(t,e,o){B(o);let n=document.createElement("div");n.className="helper-icon";let i=chrome.runtime.getURL("../assets/wernicke_logo_big.png");n.style.backgroundImage=`url(${i})`,n.style.position="absolute",n.style.left=`${t+10}px`,n.style.top=`${e+30}px`,n.style.width="32px",n.style.height="32px",n.style.backgroundSize="cover",n.style.cursor="pointer",n.style.zIndex=9999,n.addEventListener("click",r=>{console.log("Icon clicked"),r.stopPropagation(),I(t,e,o)}),document.body.appendChild(n),o.helperIconRef.value=n}function B(t){let e=t.helperIconRef.value;e&&e.parentNode&&(e.parentNode.removeChild(e),t.helperIconRef.value=null)}function D(t){let e=window.getSelection(),o=e.toString().trim();if(!o){t.pendingSelectionRef.value=null;return}let i=e.getRangeAt(0).getBoundingClientRect();t.pendingSelectionRef.value={text:o,x:i.left+window.scrollX,y:i.top+window.scrollY}}function R(t){setTimeout(()=>{let e=t.pendingSelectionRef.value;e&&e.text!==t.lastSelectedTextRef.value&&(t.lastSelectedTextRef.value=e.text,k(e.x,e.y,t))},10)}function C(t,e){let o=e.helperIconRef.value,n=e.menuBoxRef.value,i=n&&n.contains(t.target),r=o&&o.contains(t.target);!i&&!r&&(w(e),B(e),e.lastSelectedTextRef.value="")}var U=null,P=null,W="",F=null,E={helperIconRef:{value:U},menuBoxRef:{value:P},lastSelectedTextRef:{value:W},pendingSelectionRef:{value:F}};document.addEventListener("selectionchange",()=>D(E));document.addEventListener("mouseup",()=>R(E));document.addEventListener("click",t=>C(t,E));})();
