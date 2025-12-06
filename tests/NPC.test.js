import { describe, it, expect } from 'vitest';
import NPC from '../src/entities/NPC.js';

describe('NPC', () => {
    it('should be created with correct properties', () => {
        const npc = new NPC(5, 5, 'Old Man', ['Hello']);
        expect(npc.x).toBe(5);
        expect(npc.y).toBe(5);
        expect(npc.char).toBe('@');
        expect(npc.color).toBe('#00ffff');
        expect(npc.name).toBe('Old Man');
        expect(npc.faction).toBe('neutral');
    });

    it('should return dialogue on interact', () => {
        const npc = new NPC(5, 5, 'Guide', ['Welcome', 'Beware']);
        const line = npc.interact();
        expect(['Welcome', 'Beware']).toContain(line.text);
    });

    it('should have default dialogue if none provided', () => {
        const npc = new NPC(5, 5, 'Mute');
        expect(npc.dialogue).toEqual(['Hello there!']);
    });

    it('should move randomly on takeTurn', () => {
        const npc = new NPC(10, 10, 'Walker');
        const map = {
            width: 20,
            height: 20,
            tiles: Array(20).fill([]).map(() => Array(20).fill('floor')),
            props: [],
            npcs: [] // Add npcs array to map mock
        };
        const entities = [];

        // Mock Math.random to ensure movement
        const originalRandom = Math.random;
        Math.random = () => 0.1; // Force move check (< 0.2)
        // Next randoms for dx, dy: need 0, 1, 2 to map to -1, 0, 1
        // We need specific direction. changing mock is tricky for multiple calls.
        // Let's just run it multiple times and expect position to change eventually.

        Math.random = originalRandom;

        let moved = false;
        for (let i = 0; i < 50; i++) {
            const startX = npc.x;
            const startY = npc.y;
            npc.takeTurn(map, entities);
            if (npc.x !== startX || npc.y !== startY) {
                moved = true;
                break;
            }
        }
        expect(moved).toBe(true);
    });
});
