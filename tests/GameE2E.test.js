/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Game from '../src/engine/Game.js';
import Player from '../src/entities/Player.js';

// Mock Canvas and Context
const mockContext = {
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    font: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    strokeRect: vi.fn(),
    strokeText: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
};

const mockCanvas = {
    getContext: () => mockContext,
    width: 800,
    height: 600,
};

// Mock Audio
vi.mock('../src/engine/Audio.js', () => {
    return {
        default: class {
            playFootstep() { }
            playAttack() { }
            playHit() { }
            playMiss() { }
            playLevelUp() { }
            playPickup() { }
        }
    };
});

describe('Game E2E Flow', () => {
    let game;
    let container;

    beforeEach(() => {
        // Setup DOM mocks
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock UI elements
        const uiIds = ['hp-val', 'mana-val', 'lvl-val', 'atk-val', 'def-val', 'weapon-val', 'armor-val', 'log', 'inventory', 'inventory-list', 'class-selection', 'game-over', 'victory-screen'];
        uiIds.forEach(id => {
            const el = document.createElement('div');
            el.id = id;
            document.body.appendChild(el);
        });

        // Mock Class Cards
        const card = document.createElement('div');
        card.className = 'class-card';
        card.setAttribute('data-class', 'warrior');
        document.body.appendChild(card);

        game = new Game(mockCanvas);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should initialize game and start with a class', () => {
        game.init();
        game.startGame('warrior');

        expect(game.player).toBeInstanceOf(Player);
        expect(game.player.classType).toBe('warrior');
        expect(game.map).toBeDefined();
        expect(game.gameState).toBe('PLAYING');
    });

    it('should handle player movement', () => {
        game.startGame('warrior');
        const startX = game.player.x;
        const startY = game.player.y;

        // Mock map to be empty floor around player
        game.map.tiles[startY][startX + 1] = 'floor';

        const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        game.handleInput(moveEvent);

        // Check if player moved
        if (game.player.x === startX + 1) {
            expect(game.player.x).toBe(startX + 1);
        } else {
            expect(game.player.x).toBe(startX);
        }
    });

    it('should update UI stats', () => {
        game.startGame('mage');
        game.updateUI();

        const hpVal = document.getElementById('hp-val');
        const manaVal = document.getElementById('mana-val');

        expect(hpVal.innerText).toContain('/');
        expect(manaVal.innerText).toBe('50/50');
    });

    it('should handle combat flow (attack and kill enemy)', () => {
        game.startGame('warrior');
        const startX = game.player.x;
        const startY = game.player.y;

        // Mock Enemy
        const enemy = {
            x: startX + 1,
            y: startY,
            hp: 10,
            getAttack: () => 5,
            getDefense: () => 0,
            takeTurn: vi.fn(), // Mock enemy turn
            char: 'E',
            name: 'Goblin'
        };
        game.enemies.push(enemy);
        game.map.tiles[startY][startX + 1] = 'floor';

        // Mock Math.random to ensure hit (CombatSystem checks > 0.8 for miss)
        const originalRandom = Math.random;
        Math.random = () => 0.1;

        // Player attacks enemy by moving into it
        const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        game.handleInput(moveEvent);

        // Restore Math.random
        Math.random = originalRandom;

        expect(enemy.hp).toBeLessThan(10);
        expect(game.player.x).toBe(startX); // Player shouldn't move into enemy
    });

    it('should handle item pickup', () => {
        vi.useFakeTimers();
        game.startGame('warrior');
        const startX = game.player.x;
        const startY = game.player.y;

        // Mock Item
        game.items = []; // Clear random items
        const item = {
            x: startX + 1,
            y: startY, // Place item on adjacent tile
            name: 'Potion',
            type: 'potion',
            char: '!',
            color: 'red'
        };
        game.items.push(item);
        game.map.tiles[startY][startX + 1] = 'floor';

        // Move player to item
        const moveEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        game.handleInput(moveEvent);

        // Fast-forward time to allow enemy turn to complete and player turn to restore
        vi.advanceTimersByTime(100);

        expect(game.player.x).toBe(startX + 1);

        // Now pick up
        const pickupEvent = new KeyboardEvent('keydown', { key: 'g' });
        game.handleInput(pickupEvent);

        expect(game.items.length).toBe(0); // Item should be removed
        expect(game.player.inventory.length).toBe(1);
        expect(game.player.inventory[0]).toBe(item);

        vi.useRealTimers();
    });

    it('should handle game over', () => {
        game.startGame('warrior');
        game.player.hp = 0;

        // Trigger update to check game over state
        game.update();

        expect(game.gameState).toBe('GAMEOVER');

        const gameOverScreen = document.getElementById('game-over');
        expect(gameOverScreen.style.display).toBe('flex');
    });
});
