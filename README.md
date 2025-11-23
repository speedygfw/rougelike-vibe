# My Roguelike - Dungeon Crawler

## 🎮 Play Now
You can play the game directly in your browser here:
**[👉 Click here to play](https://speedygfw.github.io/rougelike-vibe/)**

## 🚀 Start Game (Local)

To start the game locally, follow these steps:

1.  **Clone Repository** (if not already done).
2.  **Install Dependencies**:
    Open a terminal in the project folder and run:
    ```bash
    npm install
    ```
3.  **Start Development Server**:
    ```bash
    npm run dev
    ```
4.  Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

## 📖 About the Game

This project was created as an experiment in collaboration between human and AI.

*   **Origin**: The game was developed in a pair programming session with an AI. The goal was to build a functioning Roguelike from scratch, starting with the base engine up to complex features like inventory management and boss fights.
*   **Technology**:
    *   **Engine**: Custom JavaScript engine (no external game libraries).
    *   **Rendering**: HTML5 Canvas.
    *   **UI**: HTML/CSS with a "Dark Glass" design.
    *   **Build Tool**: Vite.
    *   **Tests**: Vitest.

## 🎮 How to Play

**[📖 Click here for the Full Game Guide & Bestiary](GAME_GUIDE.md)**

### Goal
Your goal is to descend deep into the dungeon and find the **Amulet of Yendor** on **Level 10**. Once you possess it, you have won!

### Controls
*   **Arrow Keys**: Move and Attack (move into enemies).
*   **Mouse**: Interact with UI (Inventory, Logs).

### Mechanics
*   **Turn-based**: The world only moves when you move. Take your time for your decisions.
*   **Classes**: Choose at the start between Warrior (more HP), Mage (less HP), and Rogue.
*   **Combat**: Move onto a tile with an enemy to attack.
*   **Equipment**: Find weapons and armor to become stronger.
*   **Items**: Use potions, scrolls, and find keys for locked doors.
*   **Level Variety**: Explore classic dungeons and organic cave systems.
*   **Enemies**: Different enemies have different behaviors. Beware of the Dragon on Level 10!

---

## 🛠️ Development Diary

Below you will find the log of the development phases of this project.

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
