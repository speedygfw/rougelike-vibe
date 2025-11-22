# Mein Roguelike - Dungeon Crawler

## 🎮 Jetzt Spielen
Du kannst das Spiel direkt hier im Browser spielen:
**[👉 Hier klicken um zu spielen](https://speedygfw.github.io/rougelike-vibe/)**

*(Hinweis: Der Link funktioniert erst, nachdem der Code auf GitHub gepusht wurde und die "Deploy to GitHub Pages" Action durchgelaufen ist.)*

## 🚀 Spiel Starten (Lokal)

Um das Spiel lokal zu starten, folge diesen Schritten:

1.  **Repository klonen** (falls noch nicht geschehen).
2.  **Abhängigkeiten installieren**:
    Öffne ein Terminal im Projektordner und führe aus:
    ```bash
    npm install
    ```
3.  **Entwicklungsserver starten**:
    ```bash
    npm run dev
    ```
4.  Öffne die im Terminal angezeigte URL (meist `http://localhost:5173`) in deinem Browser.

## 📖 Über das Spiel

Dieses Projekt entstand als Experiment in der Zusammenarbeit zwischen Mensch und KI.

*   **Entstehung**: Das Spiel wurde in einer Pair-Programming-Session mit einer KI entwickelt. Ziel war es, von Grund auf ein funktionierendes Roguelike zu bauen, angefangen bei der Basis-Engine bis hin zu komplexeren Features wie Inventar-Management und Boss-Kämpfen.
*   **Technologie**:
    *   **Engine**: Eigene JavaScript-Engine (keine externen Game-Libraries).
    *   **Rendering**: HTML5 Canvas.
    *   **UI**: HTML/CSS mit einem "Dark Glass" Design.
    *   **Build-Tool**: Vite.
    *   **Tests**: Vitest.

## 🎮 Spielanleitung

### Ziel
Dein Ziel ist es, tief in den Dungeon hinabzusteigen und das **Amulett von Yendor** auf **Level 10** zu finden. Sobald du es besitzt, hast du gewonnen!

### Steuerung
*   **Pfeiltasten**: Bewegen und Angreifen (in Gegner hineinbewegen).
*   **Maus**: Interaktion mit dem UI (Inventar, Logs).

### Mechaniken
*   **Rundenbasiert**: Die Welt bewegt sich nur, wenn du dich bewegst. Nimm dir Zeit für deine Entscheidungen.
*   **Klassen**: Wähle zu Beginn zwischen Krieger (mehr HP), Magier (weniger HP) und Schurke.
*   **Kampf**: Bewege dich auf ein Feld mit einem Gegner, um anzugreifen.
*   **Ausrüstung**: Finde Waffen und Rüstungen, um stärker zu werden.
*   **Items**: Nutze Tränke, Schriftrollen und finde Schlüssel für verschlossene Türen.
*   **Level-Vielfalt**: Erkunde klassische Dungeons und organische Höhlensysteme.
*   **Gegner**: Verschiedene Gegner haben unterschiedliche Verhaltensweisen. Vorsicht vor dem Drachen auf Level 10!

---

## 🛠️ Entwicklungstagebuch

Nachfolgend findest du das Protokoll der Entwicklungsphasen dieses Projekts.

### 1. Game Setup & Core Mechanics
I successfully wired up the game entry point and verified the core mechanics.

*   **Entry Point**: Fixed `src/main.js` conflict.
*   **Mechanics**: Verified movement, map generation, and basic combat.

### 2. UI/UX Overhaul
I upgraded the game's interface to a premium "Dark Glass" aesthetic.

*   **Glassmorphism**: Added semi-transparent backgrounds with blur to UI panels.
*   **Typography**: Integrated 'Cinzel' (headers) and 'Inter' (body) fonts.
*   **Animations**: Added fade-in and slide-in effects for logs and menus.
*   **Styling**: Created a consistent color palette with neon accents.

### 3. Content Expansion
I added depth to the gameplay with new items, enemies, and equipment.

*   **New Features**:
    *   **Scrolls**: Added `ScrollOfFireball` (AOE damage) and `ScrollOfTeleport` (Escape).
    *   **Advanced AI**:
        *   Shaman: Casts ranged spells and flees if too close.
        *   Bat: Moves faster/erratically.
    *   **Tiered Equipment**: Weapons and Armor now have tiers (e.g., Rusty Dagger -> Mithril Blade) that scale with player level.

### 4. Testing & Refactoring
I established a robust testing environment to ensure game stability.

*   **Refactoring**: Moved all tests to a dedicated `tests/` directory for better organization.
*   **New Tests**: Added unit tests for Scrolls (Fireball/Teleport) and Enemy AI (Shaman fleeing/Bat movement).
*   **Verification**: Ran the full test suite with vitest, confirming all 16 tests pass.

### 5. Endgame Content
I implemented the final challenge and victory condition for the game.

*   **Boss Battle**: Added a Dragon enemy that spawns at Level 10.
    *   High HP (150) and Attack (20).
    *   Special 'Firebreath' attack (25 damage) when aligned with the player.
*   **Win Condition**: Added the Amulet of Yendor.
    *   Spawns on Level 10.
    *   Picking it up or using it triggers the Victory state.
*   **Victory Screen**: A dedicated screen to celebrate the player's success.

### 6. Feature Expansion & Polish
I implemented major gameplay features to increase variety and replayability.

*   **Character Classes**: Added a class selection screen (Warrior, Rogue, Mage) impacting starting stats.
*   **Doors & Keys**: Added locked doors and keys to dungeon generation.
*   **Varied Levels**: Implemented Cellular Automata for Cave generation, mixing up the level styles.
*   **Polish**: Refined the UI and added comprehensive unit tests for all new features.
