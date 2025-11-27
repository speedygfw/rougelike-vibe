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

## 🛠️ Project Milestones

The development of **Mein Roguelike** evolved through several key phases:

### Phase 1: Core Engine & Mechanics
*   Built a custom JavaScript engine from scratch (no external libraries).
*   Implemented turn-based movement, collision detection, and basic combat.
*   Created a robust Map Generator using Cellular Automata for organic caves and BSP for dungeon rooms.

### Phase 2: Visuals & UI Overhaul
*   Designed the "Dark Glass" aesthetic with semi-transparent panels and neon accents.
*   Integrated `Cinzel` and `Inter` fonts for a premium feel.
*   Added atmospheric animations (fade-ins, slide-ins) and particle effects.

### Phase 3: Gameplay Depth
*   **Class System**: Implemented Warrior, Mage, and Rogue classes with unique starting stats.
*   **Inventory & Equipment**: Added a full inventory system with tiered weapons, armor, and potions.
*   **Magic System**: Created a spell casting system with diverse spells (Fireball, Teleport, etc.).

### Phase 4: The "Echoes" Expansion
*   **Story Integration**: Added the "Echoes of Aethelgard" narrative, including intro/outro screens and lore.
*   **World Expansion**: Increased dungeon size to **20 Levels** with a dedicated Boss fight at the end.
*   **Living World**: Introduced friendly NPCs, enemy factions, and guaranteed key drops.
*   **Spell Book**: Added a dedicated UI for managing learned spells.
*   **Quality Assurance**: Verified stability with a comprehensive suite of **59 automated tests**.
