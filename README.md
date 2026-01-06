# Wernicke — AI-Powered Browser Extension for Context-Aware Word Analysis

![Wernicke Logo](https://github.com/user-attachments/assets/8a1874ec-3b9f-4ed0-9f42-2ff6429da2f2)

**Project duration:** 03/2025 - 05/2025  (2,5 month)
**Project type:** AI / Full-Stack Project  
**Pitch deck:** [View Presentation](https://www.figma.com/slides/6vZNrsCRtTiAt8qizlPtIb/Wernicke---Web-extention--eng-?node-id=2003-29&t=bx3sjZtjf1fmjpge-0)

---

## Overview

Wernicke is a Chrome extension that provides **context-aware word analysis** powered by AI. The extension offers translations, definitions, explanations, and synonyms directly on any webpage, helping users understand and learn words in multiple languages seamlessly.

---

## Features

- Real-time **word translation** in multiple languages  
- **Definitions, explanations, and synonyms** fetched contextually  
- **AI-powered analysis** via Google Gemini  
- **Secure server-side REST API** for AI requests  
- Chrome extension architecture: **content scripts**, **background service worker**  
- Fully **MV3-compatible** for Chrome Extensions  

---

## Technologies

- **Frontend / Extension:** JavaScript, Chrome Extensions (Manifest V3), Content Scripts  
- **Backend / API:** Node.js, Express, REST APIs  
- **AI Integration:** Google Gemini, Browser Translator & LangDetector API  
- **Tools:** Figma (UI/UX design)  

---

## Architecture
![App architecture](https://github.com/user-attachments/assets/2c16f097-49fb-4ce5-bfd0-fb27fbb5f6df)

- Content scripts interact with the webpage to detect selected words  
- Background worker handles messaging between content scripts and server  
- Server securely communicates with Google Gemini to fetch AI-based translations, definitions, and synonyms  

---

## Installation

### 1. Clone repository
```bash
git clone https://github.com/Kateroook/wernicke.git
cd wernicke
```
### 2. Install dependencies
```bash
cd server
npm install
```
### 3. Run server
```bash
npm start
```
### 4. Load extension in Chrome
- Go to chrome://extensions/
- Enable Developer mode
- Click Load unpacked
- Select the web-extension folder

--- 

## Usage
- Highlight any word on a webpage
- Click the Wernicke icon or use the context menu
- Get translations, definitions, explanations, and synonyms instantly

---

## Screenshots
<div style="margin-bottom: 15px">
<img src="https://github.com/user-attachments/assets/45224402-9a4c-4112-9636-492955c3d2b0" alt="Highlight word" width="45%"  style="margin: 10px; vertical-align: top;">
<img src="https://github.com/user-attachments/assets/f79d740d-2cf1-4b23-bcd7-0dac08c42934" alt="Menu" width="45%" style="margin: 10px; vertical-align: top;">
</div>
<div style="margin-bottom: 15px;">
<img src="https://github.com/user-attachments/assets/557f62a3-5102-4174-abc3-f25fa5dd522f" alt="Translation" width="45%" style="margin: 10px; vertical-align: top;">
<img src="https://github.com/user-attachments/assets/eaac93dc-a31e-4e8d-af63-8b91c4569fd3" alt="Definition" width="45%" style="margin: 10px; vertical-align: top;">
</div>
<div style="margin-bottom: 15px;">
<img src="https://github.com/user-attachments/assets/02b72931-0555-4fd5-ab92-77e463cc1cbd" alt="Synonyms" width="45%" style="margin: 10px; vertical-align: top;">
</div>

--- 

## Future improvements 
- Integration of additional language APIs to improve translation accuracy
- Expansion of functionality, including a learning system and personalized dictionaries
- Performance optimization for even faster language data processing
