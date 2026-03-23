# 🔥 Firebase Setup Guide

För att appen ska kunna spara dina tankningar i molnet (så att de finns kvar även om du byter dator eller rensar webbläsaren) behöver du koppla ihop den med Firebase.

## 1. Skapa projekt
1.  Gå till [Firebase Console](https://console.firebase.google.com/).
2.  Klicka på **"Add project"** och döp det till t.ex. `Bensinpris-App`.
3.  Klicka dig igenom (du behöver inte Google Analytics för detta).

## 2. Registrera Web App
1.  På projektets startsida, klicka på den lilla webb-ikonen (**</>**).
2.  Ge appen ett smeknamn (t.ex. `Bensin Web`).
3.  Du kommer nu få en kodbit som ser ut så här:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

## 3. Uppdatera koden i Antigravity
1.  Öppna filen `app.js`.
2.  Hitta `const firebaseConfig` högst upp (rad 7).
3.  Byt ut mina placeholder-värden mot dina egna värden från Firebase.

## 4. Aktivera Authentication
1.  I Firebase-menyn till vänster, gå till **Build** -> **Authentication**.
2.  Klicka på **Get Started**.
3.  Välj **Email/Password** som Sign-in provider och aktivera det.

---

När detta är klart kommer dina inloggningar att vara "på riktigt"! Appen kommer automatiskt börja använda dessa inställningar.
