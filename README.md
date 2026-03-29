# ⛽ Bensinpris App

En modern, mobilanpassad webbapplikation för att hitta de billigaste bensinstationerna i din närhet och logga dina tankningar med stil. 

![Dashboard Preview](https://github.com/Farhad030619/benzinpriser/raw/main/public/preview.png)

## 📸 Förhandsvisning

| Inloggning | Karta & Stationer | Din Profil |
| :---: | :---: | :---: |
| ![Login](https://github.com/Farhad030619/benzinpriser/raw/main/public/login_preview.png) | ![Dashboard](https://github.com/Farhad030619/benzinpriser/raw/main/public/preview.png) | ![Profile](https://github.com/Farhad030619/benzinpriser/raw/main/public/profile_preview.png) |

## ✨ Höjdpunkter

- 📍 **Hitta stationer**: Automatisk positionsbestämning och sökning via Overpass API.
- 💰 **Prisjämförelse**: Se direkt vilken station som är billigast, närmast eller har bäst trend i din valda radie.
- ⛽ **Drivmedelsstöd**: Växla smidigt mellan Bensin 95, 98, Diesel och Fordonsgas.
- 📱 **Progressive Web App**: Installera appen direkt på mobilen för en snabbare upplevelse.
- 📊 **Historik**: Logga dina tankningar och följ din totala förbrukning och kostnad månadsvis.
- 🎨 **Premium UI**: Modern "Glassmorphism"-design med mjuka animationer för en exklusiv känsla.

## 🚀 Kom igång

### Förutsättningar
- Node.js (version 18 eller senare)
- Ett Firebase-projekt

### Installation

1. Klona repot:
   ```bash
   git clone https://github.com/Farhad030619/benzinpriser.git
   cd benzinpriser
   ```

2. Installera beroenden:
   ```bash
   npm install
   ```

3. Skapa en `.env`-fil i roten och lägg till dina Firebase-uppgifter:
   ```env
   VITE_FIREBASE_API_KEY=din_nyckel
   VITE_FIREBASE_AUTH_DOMAIN=ditt_projekt.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ditt_projekt
   VITE_FIREBASE_STORAGE_BUCKET=ditt_projekt.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=ditt_id
   VITE_FIREBASE_APP_ID=ditt_app_id
   ```

4. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

## 🛠 Teknik

Appen är byggd med modern webbteknik för maximal prestanda:
- **Frontend**: [React](https://reactjs.org/) & [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Ikoner**: [Lucide React](https://lucide.dev/)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore & Auth)

---

*Utvecklad för att göra det enkelt och snyggt att spara pengar vid pumpen.*
