import { describe, it, expect, vi, beforeEach } from 'vitest';
import Game from '../src/engine/Game.js';
import Player from '../src/entities/Player.js';
import MapGenerator from '../src/engine/MapGenerator.js';

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
    getElementById: vi.fn((id) => {
        if (id === 'class-selection') return { style: { display: 'block' } };
        if (id === 'inventory') return { style: { display: 'none' } };
        if (id === 'inventory-list') return { innerHTML: '' };
        if (id === 'log') return { prepend: vi.fn(), children: [], removeChild: vi.fn() };
        return { innerText: '', onclick: null, style: {} };
    }),
    createElement: vi.fn(() => ({
        style: {},
        classList: { add: vi.fn() },
        appendChild: vi.fn(),
        onclick: null
    })),
    body: {
        appendChild: vi.fn()
    },
    querySelectorAll: vi.fn(() => [])
};

class AudioContextMock {
    createGain() { return { connect: vi.fn(), gain: { value: 0 } }; }
    createOscillator() { return { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 }, type: '' }; }
    get destination() { return {}; }
}

global.window = {
    addEventListener: vi.fn(),
    AudioContext: AudioContextMock,
    webkitAudioContext: AudioContextMock
};

global.requestAnimationFrame = vi.fn();

describe('Game Features', () => {
    let game;

    beforeEach(() => {
        game = new Game(canvasMock);
    });

    describe('Character Classes', () => {
        it('should initialize Warrior with correct stats', () => {
            const player = new Player(0, 0, 'warrior');
            expect(player.classType).toBe('warrior');
            expect(player.maxHp).toBe(120); // 100 + 20
            expect(player.hp).toBe(120);
        });

        it('should initialize Mage with correct stats', () => {
            const player = new Player(0, 0, 'mage');
            expect(player.classType).toBe('mage');
            expect(player.maxHp).toBe(80); // 100 - 20
            expect(player.hp).toBe(80);
        });

        it('should initialize Rogue with correct stats', () => {
            const player = new Player(0, 0, 'rogue');
            expect(player.classType).toBe('rogue');
            expect(player.maxHp).toBe(100);
            // Rogue items would be checked if we mocked Item classes or checked inventory
        });
    });

    describe('Map Generation', () => {
        it('should generate caves', () => {
            const mapGen = new MapGenerator(50, 30);
            const map = mapGen.generateCaves();
            expect(map.width).toBe(50);
            expect(map.height).toBe(30);
            expect(map.tiles.length).toBe(30);
            expect(map.tiles[0].length).toBe(50);
            // Check borders
            expect(map.tiles[0][0]).toBe('wall');
        });

        it('should randomly choose between dungeon and caves', () => {
            const mapGen = new MapGenerator(50, 30);
            // Mock Math.random to force dungeon
            const originalRandom = Math.random;
            Math.random = () => 0.1;
            const dungeonMap = mapGen.generate();
            expect(dungeonMap.rooms.length).toBeGreaterThan(0);

            // Mock Math.random to force caves
            Math.random = () => 0.9;
            const caveMap = mapGen.generate();
            expect(caveMap.rooms.length).toBe(0);

            Math.random = originalRandom;
        });
    });
});
