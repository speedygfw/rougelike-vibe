import { describe, it, expect } from 'vitest';
import Entity from './Entity';

describe('Entity', () => {
    it('should initialize with correct properties', () => {
        const entity = new Entity(10, 20, '@', '#fff');
        expect(entity.x).toBe(10);
        expect(entity.y).toBe(20);
        expect(entity.char).toBe('@');
        expect(entity.color).toBe('#fff');
    });

    it('should move if tile is not a wall', () => {
        const entity = new Entity(1, 1, '@', '#fff');
        const map = {
            width: 10,
            height: 10,
            tiles: [['wall', 'wall', 'wall'], ['wall', 'floor', 'floor'], ['wall', 'floor', 'floor']]
        };

        // Move right (1,1 -> 2,1)
        const moved = entity.move(1, 0, map);
        expect(moved).toBe(true);
        expect(entity.x).toBe(2);
        expect(entity.y).toBe(1);
    });

    it('should not move if tile is a wall', () => {
        const entity = new Entity(1, 1, '@', '#fff');
        const map = {
            width: 10,
            height: 10,
            tiles: [['wall', 'wall', 'wall'], ['wall', 'floor', 'wall'], ['wall', 'floor', 'floor']]
        };

        // Move right (1,1 -> 2,1 is wall)
        const moved = entity.move(1, 0, map);
        expect(moved).toBe(false);
        expect(entity.x).toBe(1);
        expect(entity.y).toBe(1);
    });
});
