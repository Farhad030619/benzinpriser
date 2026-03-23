# 🚀 Kom igång med Bensinpris-appen

Här är exakt hur du får appen att snurra på din dator och hur du använder den.

## Steg 1: Starta appen (Viktigt!)
Webbläsare blockerar vissa funktioner om man bara dubbelklickar på filen. Du måste köra den via en "lokal server".

1.  Öppna din terminal (Terminal.app på Mac).
2.  Kopiera och klistra in detta kommando och tryck på Enter:
    ```bash
    cd "/Users/farhadjelve/Documents/Jensen App/Bensinpris app" && npx serve .
    ```
3.  Terminalen kommer ge dig en länk, oftast `http://localhost:3000`. 
4.  **Klicka på länken** eller kopiera in den i din webbläsare.

---

## Steg 2: Inloggning
När sidan laddas ser du inloggningsskärmen.
1.  Skriv in en test-email, t.ex. `hej@antigravity.se`.
2.  Tryck på den stora gula knappen **"Logga in / Skapa konto"**.
3.  Nu är du inne!
## 🚀 Driftsättning (Vercel)

Appen är byggd för att fungera direkt på Vercel:

1. **Ladda upp koden till GitHub.**
2. **Koppla ditt GitHub-konto till [Vercel](https://vercel.com/).**
3. **Importera projektet**. Vercel kommer automatiskt upptäcka att det är en **Vite**-app.
4. **Inställningar**: Du behöver inte ändra något, standardinställningarna (`npm run build` och `dist/`-mappen) fungerar perfekt.
5. **Klicka på Deploy!**

Nu har du din egen "Bensinpris App" live på nätet!

---

## Steg 3: Ge tillåtelse för GPS
Appen kommer fråga om den får använda din plats.
1.  Klicka på **"Tillåt"** (Allow).
2.  Appen kommer nu hämta **riktiga bensinstationer** i närheten av dig från OpenStreetMap.
3.  Om du inte tillåter kommer den visa stationer i Stockholm som standard.

---

## Steg 4: Använda funktionerna
*   **Hemsidan:** Se boxarna högst upp för bästa pris just nu.
*   **Filter:** Dra i den gula cirkeln (Radie) för att hitta stationer längre bort. Tryck på "Diesel" eller "Fordonsgas" för att byta bränsle.
*   **Profil:** Tryck på gubben (👤) längst ner. Här kan du skriva in hur mycket du tankat för (t.ex. 800 kr och 40 liter) och trycka på **Spara**. Din månadsbudget uppdateras direkt!

---

## Steg 5: Sätt upp Firebase (Frivilligt)
Just nu sparas allt bara i din webbläsare. Om du vill att det ska sparas på riktigt i molnet:
1.  Gå till [Firebase Console](https://console.firebase.google.com/).
2.  Följ guiden i filen `FIREBASE_GUIDE.md` som jag har skapat åt dig.

---

**Lycka till med din nya app! Behöver du ändra något i designen eller lägga till en funktion? Säg bara till!**
