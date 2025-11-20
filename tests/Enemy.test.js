import { describe, it, expect, vi } from 'vitest';
import Enemy from '../src/entities/Enemy';

describe('Enemy AI', () => {
    describe('Shaman', () => {
        it('should flee if too close to player', () => {
            const shaman = new Enemy(10, 10, 'shaman');
            const player = { x: 11, y: 10 }; // Distance 1
            const map = { tiles: Array(20).fill(Array(20).fill('floor')) };

            // Mock move
            shaman.move = vi.fn();

            shaman.takeTurn(player, map, vi.fn());

            // Should try to move away. Player is at x+1, so should move x-1
            expect(shaman.move).toHaveBeenCalledWith(-1, 0, map);
        });

        it('should attack if in range but safe distance', () => {
            const shaman = new Enemy(10, 10, 'shaman');
            const player = { x: 13, y: 10 }; // Distance 3 (Range is 4)
            const map = { tiles: Array(20).fill(Array(20).fill('floor')) };
            const onAttack = vi.fn();

            shaman.takeTurn(player, map, onAttack);

            expect(onAttack).toHaveBeenCalledWith('magic');
        });
    });

    describe('Bat', () => {
        it('should move twice (mocked random)', () => {
            const bat = new Enemy(10, 10, 'bat');
            const player = { x: 20, y: 20 }; // Far away
            const map = { tiles: Array(30).fill(Array(30).fill('floor')) };

            // Spy on tryMove or move. Since Bat logic calls tryMove which calls move...
            // Let's spy on move.
            bat.move = vi.fn();

            // Force random to be > 0.5 to trigger "moveTowards" twice
            vi.spyOn(Math, 'random').mockReturnValue(0.6);

            bat.takeTurn(player, map, vi.fn());

            expect(bat.move).toHaveBeenCalledTimes(2);
        });
    });
});
