import { describe, it, expect, vi, beforeEach } from 'vitest';
import Game from '../src/engine/Game.js';
import Player from '../src/entities/Player.js';
import Enemy from '../src/entities/Enemy.js';

// Mock canvas and document
const canvasMock = {
    getContext: () => ({
        clearRect: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        fillText: vi.fn(),
        font: '',
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
    }),
    width: 800,
    height: 600
};

global.document = {
    getElementById: vi.fn(() => ({ style: {} })),
    createElement: vi.fn(() => ({ style: {}, appendChild: vi.fn() })),
    body: { appendChild: vi.fn() },
    querySelectorAll: vi.fn(() => [])
};

global.window = {
    addEventListener: vi.fn(),
    AudioContext: class {
        createGain() { return { connect: vi.fn(), gain: { value: 0 } }; }
        createOscillator() { return { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 } }; }
    }
};

describe('Magic System', () => {
    let game;
    let player;

    beforeEach(() => {
        game = new Game(canvasMock);
        player = new Player(10, 10, 'mage');
        game.player = player;
        game.log = vi.fn();
        game.renderer = { triggerEffect: vi.fn() };
        game.updateUI = vi.fn();
        game.update = vi.fn();
        game.enemyTurn = vi.fn(); // Mock enemy turn to prevent async issues
    });

    it('should cast Heal', () => {
        player.hp = 10;
        player.maxHp = 100;
        player.mana = 50;
        player.spells = [{ name: 'Heal', cost: 10, heal: 20, type: 'heal' }];

        game.castSpell(0);

        expect(player.hp).toBe(30);
        expect(player.mana).toBe(40);
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('heal'), 'magic');
    });

    it('should cast Frost Nova (Freeze)', () => {
        player.mana = 50;
        player.spells = [{ name: 'Frost Nova', cost: 25, damage: 5, type: 'freeze', range: 3 }];

        const enemy = new Enemy(11, 10, 'goblin');
        game.enemies = [enemy];

        game.castSpell(0);

        expect(enemy.frozen).toBe(3);
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('frozen'), 'magic');
    });

    it('should cast Chain Lightning', () => {
        player.mana = 50;
        player.spells = [{ name: 'Chain Lightning', cost: 30, damage: 20, type: 'chain_lightning', range: 6 }];

        const enemy1 = new Enemy(11, 10, 'goblin'); // Primary target
        const enemy2 = new Enemy(12, 10, 'goblin'); // Bounce target
        enemy1.hp = 50;
        enemy2.hp = 50;
        game.enemies = [enemy1, enemy2];

        game.castSpell(0);

        expect(enemy1.hp).toBe(30); // 50 - 20
        expect(enemy2.hp).toBeLessThan(50); // Should take bounce damage (20 * 0.7 = 14) -> 36
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Lightning hits'), 'magic');
    });

    it('should cast Drain Life', () => {
        player.hp = 50;
        player.maxHp = 100;
        player.mana = 50;
        player.spells = [{ name: 'Drain Life', cost: 20, damage: 10, type: 'drain', range: 4 }];

        const enemy = new Enemy(11, 10, 'goblin');
        enemy.hp = 20;
        game.enemies = [enemy];

        game.castSpell(0);

        expect(enemy.hp).toBe(10); // 20 - 10
        expect(player.hp).toBe(55); // 50 + (10/2)
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Drained'), 'magic');
    });

    it('should cast Stone Skin (Buff)', () => {
        player.mana = 50;
        player.spells = [{ name: 'Stone Skin', cost: 20, duration: 10, defense: 5, type: 'buff' }];

        game.castSpell(0);

        expect(player.buffs.length).toBe(1);
        expect(player.buffs[0].type).toBe('buff');
        expect(player.buffs[0].amount).toBe(5);
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Stone Skin'), 'magic');
    });

    it('should cast Shadow Cloak (Invisibility)', () => {
        player.mana = 50;
        player.spells = [{ name: 'Shadow Cloak', cost: 20, duration: 5, type: 'invisibility' }];

        game.castSpell(0);

        expect(player.buffs.length).toBe(1);
        expect(player.buffs[0].type).toBe('invisibility');
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Shadow Cloak'), 'magic');
    });

    it('should cast Time Warp', () => {
        player.mana = 100;
        player.spells = [{ name: 'Time Warp', cost: 50, turns: 3, type: 'time_warp' }];
        game.extraTurns = 0;

        game.castSpell(0);

        expect(game.extraTurns).toBe(2); // 3 turns added, 1 consumed immediately 
        // Logic in Game.js: extraTurns += spell.turns; ... if (extraTurns > 0) extraTurns--;
        // So if we start with 0, add 3 -> 3. Then check at end of castSpell:
        // if (extraTurns > 0) { extraTurns--; ... }
        // So it should be 2 remaining after the cast turn consumes one?
        // Let's check Game.js logic again.
        // Line 607: this.extraTurns += spell.turns;
        // Line 643: if (this.extraTurns > 0) { this.extraTurns--; ... }
        // So 0 + 3 = 3. Then 3-- = 2.

        expect(game.extraTurns).toBe(2);
        expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Time warps'), 'magic');
    });
});
