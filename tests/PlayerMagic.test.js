/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Game from '../src/engine/Game.js';
import Player from '../src/entities/Player.js';
import Enemy from '../src/entities/Enemy.js';

// Mock Canvas
const mockCanvas = {
    getContext: () => ({
        fillStyle: '',
        fillRect: vi.fn(),
        fillText: vi.fn(),
        clearRect: vi.fn(),
        font: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: '',
        strokeRect: vi.fn(),
    }),
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

describe('Player Magic System', () => {
    let game;

    beforeEach(() => {
        game = new Game(mockCanvas);
        game.player = new Player(10, 10, 'mage');
        // Ensure map exists for FOV updates
        game.map = { width: 20, height: 20, tiles: Array(20).fill(Array(20).fill('floor')) };
        game.fov = { compute: () => new Set() };
        game.updateFOV = () => { };
        game.renderer = { triggerEffect: vi.fn(), clear: vi.fn(), drawMap: vi.fn(), drawEntity: vi.fn() };
        game.log = vi.fn();
    });

    it('should initialize Mage with mana and spells', () => {
        expect(game.player.mana).toBe(50);
        expect(game.player.maxMana).toBe(50);
        expect(game.player.spells.length).toBeGreaterThan(0);
        expect(game.player.spells[0].name).toBe('Magic Missile');
    });

    it('should cast spell and deduct mana', () => {
        const spell = game.player.spells[0]; // Magic Missile
        const initialMana = game.player.mana;

        // Add an enemy nearby
        const enemy = new Enemy(11, 10, 'goblin');
        enemy.hp = 20;
        game.enemies.push(enemy);

        game.castSpell(0);

        expect(game.player.mana).toBe(initialMana - spell.cost);
        expect(enemy.hp).toBeLessThan(20);
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('You cast Magic Missile'), 'magic');
    });

    it('should fail to cast spell with insufficient mana', () => {
        game.player.mana = 0;
        const spell = game.player.spells[0];

        // Add an enemy nearby
        const enemy = new Enemy(11, 10, 'goblin');
        enemy.hp = 20;
        game.enemies.push(enemy);

        game.castSpell(0);

        expect(game.player.mana).toBe(0);
        expect(enemy.hp).toBe(20); // No damage
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Not enough mana'), 'warning');
    });
});
