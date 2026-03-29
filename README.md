# ⛽ Bensinpris App: Resilient Fuel Tracking & Logging

En modern, mobilanpassad webbapplikation byggd för att lösa ett vardagligt problem: att snabbt hitta billigaste bränslet och hålla koll på fordonskostnader i realtid.

![Dashboard Preview](https://github.com/Farhad030619/benzinpriser/raw/main/public/preview.png)

## 💡 Varför detta projekt?

Projektet startades för att utforska hur man bygger en **högpresterande och feltolerant frontend** som förlitar sig på publika API:er (OpenStreetMap). Målet var att skapa en lösning som är:
1. **Resistent mot driftstörningar**: Genom att implementera "Mirror Rotation" för kartdata.
2. **Serverless & Skalbar**: Med Firebase för autentisering och datalagring.
3. **Användarfokuserad**: En "clean" design inspirerad av moderna finansappar.

## ✨ Tekniska Höjdpunkter

- 🔄 **High Availability Overpass Logic**: Appen använder en rotationsalgoritm som testar 5 olika globala Overpass-servrar med intelligenta timeouts för att garantera dataåtkomst även vid 504-fel.
- 🛡️ **Edge-baserad Prishämtning**: Använder Vercel Serverless Functions som proxy för att hämta priser från externa källor utan CORS-begränsningar.
- 📉 **Ekonomiöversikt**: En dedikerad profil-tab som beräknar månadskostnader och förbrukning i realtid från Firebase-loggar.
- 🎨 **Modern Design**: Byggd med Tailwind CSS och Inter-typografi för en premium känsla som fungerar sömlöst som en PWA på mobilen.

## 🛠 Teknikstack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (för blixtsnabb laddning)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) (mjuka övergångar)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore för realtidsdata & Auth för säkerhet)
- **Deployment**: [Vercel](https://vercel.com/) med konfigurerad Content-Security-Policy för högsta säkerhet.

## 🚀 Installation & Installation

För att köra projektet lokalt:

1. **Klona repot**: `git clone https://github.com/Farhad030619/benzinpriser.git`
2. **Installera**: `npm install`
3. **Miljövariabler**: Skapa en `.env` med dina Firebase-nycklar (se `.env.example`).
4. **Utveckla**: `npm run dev`

---

*Detta projekt visar hur man kan kombinera open-source data med modern molnteknik för att skapa verkligt användarvärde.*
