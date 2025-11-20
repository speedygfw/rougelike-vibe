import { describe, it, expect, vi } from 'vitest';
import { ScrollOfFireball, ScrollOfTeleport } from '../src/entities/Item';
import Enemy from '../src/entities/Enemy';

describe('Items', () => {
    describe('ScrollOfFireball', () => {
        it('should damage enemies in range', () => {
            const scroll = new ScrollOfFireball(0, 0);
            const player = { x: 10, y: 10, gainXp: vi.fn() };
            const enemy1 = new Enemy(11, 10, 'goblin'); // In range (dist 1)
            const enemy2 = new Enemy(15, 15, 'goblin'); // Out of range (dist 10)
            enemy1.hp = 30;
            enemy2.hp = 30;

            const game = {
                enemies: [enemy1, enemy2],
                log: vi.fn(),
                renderer: { triggerEffect: vi.fn() }
            };

            scroll.activate(player, game);

            expect(enemy1.hp).toBe(10); // 30 - 20 damage
            expect(enemy2.hp).toBe(30); // Unchanged
            expect(game.log).toHaveBeenCalledWith(expect.stringContaining('Fireball burns'), 'combat');
        });

        it('should kill enemies and grant XP', () => {
            const scroll = new ScrollOfFireball(0, 0);
            const player = { x: 10, y: 10, gainXp: vi.fn() };
            const enemy = new Enemy(11, 10, 'goblin');
            enemy.hp = 10; // Will die

            const game = {
                enemies: [enemy],
                log: vi.fn(),
                renderer: { triggerEffect: vi.fn() }
            };

            scroll.activate(player, game);

            expect(game.enemies.length).toBe(0);
            expect(player.gainXp).toHaveBeenCalled();
        });
    });

    describe('ScrollOfTeleport', () => {
        it('should move player to a valid location', () => {
            const scroll = new ScrollOfTeleport(0, 0);
            const player = { x: 1, y: 1 };
            const game = {
                map: {
                    width: 10,
                    height: 10,
                    tiles: Array(10).fill(Array(10).fill('floor')) // All floor
                },
                log: vi.fn(),
                updateFOV: vi.fn()
            };

            // Mock random to return 0.5 -> floor(5) = 5
            vi.spyOn(Math, 'random').mockReturnValue(0.5);

            scroll.activate(player, game);

            expect(player.x).toBe(5);
            expect(player.y).toBe(5);
            expect(game.log).toHaveBeenCalledWith(expect.stringContaining('teleport'), 'magic');
        });
    });
});
