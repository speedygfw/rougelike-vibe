import { describe, it, expect } from 'vitest';
import MapGenerator from './MapGenerator';

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

    it('should populate village with Elder and villagers', () => {
        const generator = new MapGenerator(30, 30);
        const map = generator.generateVillage();

        const elder = map.npcs.find(n => n.name === 'Elder Aethel');
        expect(elder).toBeDefined();
        expect(elder?.image).toBe('assets/elder_portrait.png');

        // Should have Elder + some villagers
        expect(map.npcs.length).toBeGreaterThan(1);
    });
});
