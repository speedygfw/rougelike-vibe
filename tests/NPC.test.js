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
});
