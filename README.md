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

This project was created as an experiment in collaboration between human and AI. It is a fully functional Roguelike dungeon crawler built from scratch with JavaScript.

## 📜 Story: The Echoes of Aethelgard

The realm of **Aethelgard** has fractured. Time itself is unraveling, consumed by a chaotic force known as **The Dissonance**. You are a traveler from beyond the veil, seeking the **Harmonic Core** to restore balance to the timeline.

But beware... the echoes of the past are not always friendly. You must descend 20 levels deep into the distorted reality, facing twisted creatures and ancient guardians to save the world from eternal silence.

## ✨ Key Features

*   **20 Levels of Danger**: Explore a massive dungeon with 20 unique levels, ending in a climactic boss fight.
*   **3 Unique Classes**:
    *   **Warrior**: A tanky fighter with high HP and strength.
    *   **Mage**: A master of the arcane who starts with powerful spells.
    *   **Rogue**: A stealthy assassin with high critical hit chance.
*   **Spell Book System**: Learn and cast powerful magic like *Fireball*, *Chain Lightning*, and *Time Warp*. Press **'B'** to manage your spells.
*   **Dynamic World**:
    *   **NPCs**: Meet friendly characters who offer lore and advice.
    *   **Factions**: Watch enemies fight each other (e.g., Skeletons vs. Goblins).
    *   **Varied Environments**: Traverse classic brick dungeons and organic cave systems.
*   **Modern UI**: A sleek "Dark Glass" interface with animations and clear feedback.

## 🎮 How to Play

**[📖 Click here for the Full Game Guide & Bestiary](GAME_GUIDE.md)**

### Goal
Descend to **Level 20**, defeat **The Dissonance** (Dragon Boss), and retrieve the **Harmonic Core**.

### Controls
*   **Arrow Keys**: Move and Attack (bump into enemies).
*   **B**: Open **Spell Book**.
*   **I**: Open **Inventory**.
*   **G**: **Pick up** items.
*   **1-9**: Cast Spells.
*   **Mouse**: Interact with UI.

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
*   **Verification**: Ran the full test suite with vitest, confirming all 59 tests pass.

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

### 7. Story & Expansion Update
I integrated a narrative layer and expanded the game's scope.

*   **Story**: Added "The Echoes of Aethelgard" intro and enhanced ending texts.
*   **Expansion**: Increased dungeon depth to **20 Levels**.
*   **NPCs**: Added friendly NPCs with dialogue to flesh out the world.
*   **Spell Book**: Added a dedicated UI ('B') to view and manage spells.
*   **Quality of Life**: Guaranteed key drops to prevent soft-locks.
