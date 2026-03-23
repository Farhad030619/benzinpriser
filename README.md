# ⛽ Bensinpris App

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

En modern, mobilanpassad webbapplikation för att hitta de billigaste bensinstationerna i din närhet och logga dina tankningar med stil.

![Dashboard Preview](https://github.com/Farhad030619/benzinpriser/raw/main/public/preview.png)

## ✨ Funktioner

- 📍 **Hitta stationer**: Automatisk positionsbestämning och sökning via Overpass API.
- 💰 **Prisjämförelse**: Hitta snabbt den billigaste stationen i din valda radie.
- 📊 **Trendanalys**: Se prisutveckling och trender baserat på din position.
- ⛽ **Drivmedelsstöd**: Växla mellan Bensin 95, 98, Diesel och E85.
- 📱 **PWA-Ready**: Installera appen direkt på hemskärmen.
- 🔒 **Säkerhet**: Autentisering och datalagring via Firebase (Firestore).
- 🎨 **Premium UI**: Glassmorphism, responsiv design och mjuka animationer med Framer Motion.

## 🚀 Kom igång

### Förutsättningar

- Node.js (v18+)
- Firebase-konto

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

3. Konfigurera miljövariabler:
   Skapa en `.env`-fil i roten och lägg till dina Firebase-uppgifter:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Kör lokalt:
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animationer**: Framer Motion
- **Backend/DB**: Firebase Firestore & Auth
- **Ikoner**: Lucide React
- **Källkod**: [GitHub](https://github.com/Farhad030619/benzinpriser)

## 📦 Deployment

Rekommenderas att hostas på **Vercel** eller **Netlify**. Kom ihåg att lägga till dina miljövariabler i dashboarden för din hosting-tjänst.

---

Designad och utvecklad med ❤️ för en bättre tankupplevelse.
