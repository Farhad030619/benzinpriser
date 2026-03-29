# ⛽ Bensinpris: Carbon Neon Fuel

![Bensinpris Header](https://raw.githubusercontent.com/Farhad030619/benzinpriser/main/public/preview.png)

> **Bensinpris** is a premium, high-performance web application designed to help users discover the most competitive fuel prices in their vicinity. Built with a signature "Carbon Neon Fuel" aesthetic, it combines industrial design with real-time telemetry.

---

## ⚡ Visual Experience: Carbon Neon Fuel

The application features a custom-engineered design system focused on high-contrast readability and premium "Glassmorphism" effects.

- **🌑 Carbon Dark Base**: A deep, neutral obsidian foundation (`zinc-950`) optimized for OLED displays and reduced eye strain.
- **🌈 Dynamic Fuel Glow**: The entire interface adapts its neon accent colors (Amber, Sky, Emerald, Rose) based on the selected fuel type (95, Diesel, Gas, 98).
- **🧪 Industrial Typography**: Utilizing **Sora** for bold, technical headers and **Space Grotesk** for clean, data-heavy displays.
- **✨ Fluid Motion**: Powered by `framer-motion` for a responsive, "liquid" navigation and interaction feel.

---

## 🚀 Key Features

- 📍 **Real-time Discovery**: Scans local geography using the Overpass API (OpenStreetMap) to find fuel stations within a 1-50km radius.
- 💰 **Price Optimization**: Instant sorting by price or distance to find the "Best Alternative" at a glance.
- 👨‍💻 **Community Telemetry**: Registered users can report prices directly from the pump, earning points and climbing the ranks.
- 📈 **Trend Analysis**: Visual indicators for price stability and verification status.
- 📱 **PWA-Ready**: Fully responsive and installable as a Progressive Web App for a native-like experience on iOS and Android.

---

## 🛠 Technology Stack

### Core
- **Framework**: [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Engine**: [Tailwind CSS v4](https://tailwindcss.com/)

### Interaction & UI
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: [Google Fonts (Sora & Space Grotesk)](https://fonts.google.com/)

### Backend & Infrastructure
- **Cloud**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Data Source**: [Overpass API](https://overpass-turbo.eu/) & [Nominatim](https://nominatim.org/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🔒 Security & Architecture

- **Hardened Security Rules**: Firestore rules enforce authenticated writes and public read access, preventing unauthorized data tampering.
- **API Proxying**: Sensitive geographic queries are handled with whitelist-based parameter validation.
- **Clean Architecture**: Decoupled components with a centralized design token system in `index.css`.

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/Farhad030619/benzinpriser.git
   cd benzinpriser
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Launch**
   ```bash
   npm run dev
   ```

---

*Designed and developed for the modern driver.*
