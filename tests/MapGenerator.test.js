import { describe, it, expect } from 'vitest';
import MapGenerator from '../src/engine/MapGenerator';

describe('MapGenerator', () => {
    it('should generate a map with correct dimensions', () => {
        const width = 20;
        const height = 15;
        const generator = new MapGenerator(width, height);
        const map = generator.generate();

        expect(map.width).toBe(width);
        expect(map.height).toBe(height);
        expect(map.tiles.length).toBe(height);
        expect(map.tiles[0].length).toBe(width);
    });

    it('should contain stairs', () => {
        const generator = new MapGenerator(20, 20);
        const map = generator.generate();

        let hasStairs = false;
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.tiles[y][x] === 'stairs') {
                    hasStairs = true;
                    break;
                }
            }
        }
        expect(hasStairs).toBe(true);
    });
    it('should assign a theme to the map', () => {
        const generator = new MapGenerator(20, 20);
        const map = generator.generate();
        expect(map.theme).toBeDefined();
        expect(map.theme.name).toBeDefined();
        expect(map.theme.colors).toBeDefined();
    });

    it('should generate props on the map', () => {
        const generator = new MapGenerator(20, 20);
        const map = generator.generate();
        expect(map.props).toBeDefined();
        // Props are random, but we can check it's an array
        expect(Array.isArray(map.props)).toBe(true);
    });
    it('should not have overlapping rooms', () => {
        const generator = new MapGenerator(50, 50);
        // Force dungeon generation
        const map = generator.generateDungeon();

        for (let i = 0; i < map.rooms.length; i++) {
            for (let j = i + 1; j < map.rooms.length; j++) {
                const r1 = map.rooms[i];
                const r2 = map.rooms[j];

                // Check for overlap
                const overlap = !(r1.x + r1.w < r2.x ||
                    r2.x + r2.w < r1.x ||
                    r1.y + r1.h < r2.y ||
                    r2.y + r2.h < r1.y);

                expect(overlap).toBe(false);
            }
        }
    });

    it('should have all rooms connected', () => {
        const generator = new MapGenerator(50, 50);
        const map = generator.generateDungeon();

        if (map.rooms.length === 0) return; // Should have rooms

        // BFS to check connectivity
        const startRoom = map.rooms[0];
        const startX = Math.floor(startRoom.x + startRoom.w / 2);
        const startY = Math.floor(startRoom.y + startRoom.h / 2);

        const visited = new Set();
        const queue = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);

        let reachableTiles = 0;

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            reachableTiles++;

            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
                    if (map.tiles[ny][nx] !== 'wall' && !visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        // Check if center of every room is visited
        for (const room of map.rooms) {
            const cx = Math.floor(room.x + room.w / 2);
            const cy = Math.floor(room.y + room.h / 2);
            expect(visited.has(`${cx},${cy}`)).toBe(true);
        }
    });
});
