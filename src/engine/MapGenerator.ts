import { getRandomTheme, Themes } from './Theme.js';

export interface MapData {
    width: number;
    height: number;
    tiles: string[][];
    rooms: Room[];
    props: Prop[];
    npcs: NPCData[];
    theme?: any;
    startX?: number;
    startY?: number;
    level?: number;
}

export interface Room {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Prop {
    x: number;
    y: number;
    type: string;
    char: string;
}

export interface NPCData {
    x: number;
    y: number;
    name: string;
    dialogues: string[];
    image?: string;
}

export default class MapGenerator {
    width: number;
    height: number;
    rooms: Room[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.rooms = [];
    }

    generate(level: number = 1): MapData {
        let map: MapData;

        // Biome System
        if (level === 0) {
            map = this.generateVillage(50, 40); // Larger Village
        } else if (level <= 5) {
            // Crypts (Classic BSP Rooms)
            map = this.generateDungeon();
            this.roundCorners(map); // Make rooms slightly organic
        } else if (level <= 10) {
            // Fungal Caverns (Cellular Automata)
            map = this.generateCaves();
        } else if (level <= 15) {
            // Catacombs (Drunkard's Walk - Winding Tunnels)
            map = this.generateDrunkardsWalk();
        } else {
            // Deep Magma (Large Caverns + dangerous terrain)
            map = this.generateDeepCaverns();
        }

        map.level = level; // Store level
        map.theme = getRandomTheme();
        this.decorateMap(map);
        this.findValidSpawn(map); // Ensure player spawns in a safe spot
        return map;
    }

    generateDrunkardsWalk(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: Array(this.height).fill(null).map(() => Array(this.width).fill('wall')),
            rooms: [],
            props: [],
            npcs: []
        };

        let x = Math.floor(this.width / 2);
        let y = Math.floor(this.height / 2);
        let floorCount = 0;
        const targetFloors = this.width * this.height * 0.4; // 40% open

        while (floorCount < targetFloors) {
            // Dig
            if (map.tiles[y][x] === 'wall') {
                map.tiles[y][x] = 'floor';
                floorCount++;
            }

            // Move
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0) y--;
            else if (dir === 1) y++;
            else if (dir === 2) x--;
            else if (dir === 3) x++;

            // Bounds check
            x = Math.max(1, Math.min(this.width - 2, x));
            y = Math.max(1, Math.min(this.height - 2, y));
        }

        this.placeStairs(map);
        return map;
    }

    generateDeepCaverns(): MapData {
        // Similar to caves but more open and with lava
        const map = this.generateCaves();

        // Add Lava Pools
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (map.tiles[y][x] === 'floor' && Math.random() < 0.05) {
                    // Start a lava pool
                    map.tiles[y][x] = 'lava'; // Ensure 'lava' is handled in Renderer!
                }
            }
        }
        // Smooth lava? Maybe later.

        return map;
    }

    roundCorners(map: MapData) {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                // If wall is surrounded by 2 orthogonal floors, it's a corner -> turn to floor?
                // Or if floor is corner...
                // Simple: Randomly turn corners of rooms into walls? No that shrinks them.
                // Turn inner corners of walls into floors.
            }
        }
    }

    placeStairs(map: MapData) {
        let sx, sy;
        do {
            sx = Math.floor(Math.random() * this.width);
            sy = Math.floor(Math.random() * this.height);
        } while (map.tiles[sy][sx] === 'wall');
        map.tiles[sy][sx] = 'stairs';
    }

    generateCaves(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [], // Caves don't have explicit rooms
            props: [],
            npcs: []
        };

        // Initialize with noise
        for (let y = 0; y < this.height; y++) {
            const row: string[] = [];
            for (let x = 0; x < this.width; x++) {
                // 45% chance of being a wall
                row.push(Math.random() < 0.45 ? 'wall' : 'floor');
            }
            map.tiles.push(row);
        }

        // Cellular Automata Smoothing
        for (let i = 0; i < 5; i++) {
            const newTiles = JSON.parse(JSON.stringify(map.tiles));
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    let neighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            if (map.tiles[y + dy][x + dx] === 'wall') neighbors++;
                        }
                    }

                    if (neighbors > 4) newTiles[y][x] = 'wall';
                    else if (neighbors < 4) newTiles[y][x] = 'floor';
                }
            }
            map.tiles = newTiles;
        }

        // Ensure borders are walls
        for (let y = 0; y < this.height; y++) {
            map.tiles[y][0] = 'wall';
            map.tiles[y][this.width - 1] = 'wall';
        }
        for (let x = 0; x < this.width; x++) {
            map.tiles[0][x] = 'wall';
            map.tiles[this.height - 1][x] = 'wall';
        }

        // Place Stairs (random floor tile)
        let sx, sy;
        do {
            sx = Math.floor(Math.random() * this.width);
            sy = Math.floor(Math.random() * this.height);
        } while (map.tiles[sy][sx] === 'wall');
        map.tiles[sy][sx] = 'stairs';
        return map;
    }

    generateVillage(width: number = 50, height: number = 40): MapData {
        const map: MapData = {
            width: width,
            height: height,
            tiles: [],
            rooms: [],
            props: [],
            npcs: [],
            level: 0
        };

        // Fill with grass
        for (let y = 0; y < height; y++) {
            const row: string[] = [];
            for (let x = 0; x < width; x++) {
                row.push('floor_grass');
            }
            map.tiles.push(row);
        }

        // Create Walls around the village
        // Create Walls around the village
        for (let x = 0; x < width; x++) {
            map.tiles[0][x] = 'wall';
            map.tiles[height - 1][x] = 'wall';
        }
        for (let y = 0; y < height; y++) {
            map.tiles[y][0] = 'wall';
            map.tiles[y][width - 1] = 'wall';
        }

        // Create Houses
        const houseCount = 6;
        for (let i = 0; i < houseCount; i++) {
            const w = 6 + Math.floor(Math.random() * 6);
            const h = 6 + Math.floor(Math.random() * 6);
            const x = 5 + Math.floor(Math.random() * (width - 10 - w));
            const y = 5 + Math.floor(Math.random() * (height - 10 - h));

            // Check overlap
            let overlap = false;
            for (let r of map.rooms) {
                if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                // Build House Walls
                for (let hy = y; hy < y + h; hy++) {
                    for (let hx = x; hx < x + w; hx++) {
                        if (hy === y || hy === y + h - 1 || hx === x || hx === x + w - 1) {
                            map.tiles[hy][hx] = 'wall_wood';
                        } else {
                            map.tiles[hy][hx] = 'floor';
                        }
                    }
                }
                // Door
                let doorX = x + Math.floor(w / 2);
                let doorY = y + h - 1;
                if (Math.random() < 0.5) {
                    doorX = x + w - 1;
                    doorY = y + Math.floor(h / 2);
                }
                map.tiles[doorY][doorX] = 'door_closed';

                map.rooms.push({ x, y, w, h });

                // Furnish Room (Village Style)
                // Always a Bed
                if (map.tiles[y + 2][x + 2] === 'floor') map.props.push({ x: x + 2, y: y + 2, type: 'bed', char: 'B' });

                // Fireplace
                if (Math.random() < 0.7) {
                    const fx = x + Math.floor(w / 2);
                    const fy = y + 1;
                    if (map.tiles[fy][fx] === 'floor') {
                        map.props.push({ x: fx, y: fy, type: 'fireplace', char: 'F' });
                    }
                }

                // Wardrobe
                if (Math.random() < 0.6) {
                    const wx = x + 1;
                    const wy = y + Math.floor(h / 2);
                    if (map.tiles[wy][wx] === 'floor') {
                        map.props.push({ x: wx, y: wy, type: 'wardrobe', char: 'W' });
                    }
                }

                // Dresser or Chest
                if (Math.random() < 0.6) {
                    const dx = x + w - 2;
                    const dy = y + Math.floor(h / 2);
                    if (map.tiles[dy][dx] === 'floor') {
                        const type = Math.random() < 0.5 ? 'dresser' : 'chest';
                        map.props.push({ x: dx, y: dy, type, char: 'D' });
                    }
                }
            }
        }

        // Dungeon Entrance (Stairs)
        let cx = Math.floor(width / 2);
        let cy = Math.floor(height / 2);
        while (map.tiles[cy][cx] !== 'floor_grass') {
            cx++;
        }
        map.tiles[cy][cx] = 'stairs';

        // Place Well near center
        map.props.push({ x: cx - 2, y: cy + 2, type: 'well', char: 'O' });

        // Village Mega-Pack
        this.generateMarketplace(map);
        this.generateGraveyard(map);
        this.generateTavern(map);
        this.generateBlacksmith(map);
        this.generatePond(map);

        // Set Start Position (Near the well)
        map.startX = cx - 4;
        map.startY = cy + 4;
        // Ensure start pos is valid
        if (map.tiles[map.startY][map.startX] !== 'floor_grass') {
            map.startX = cx;
            map.startY = cy + 2;
        }

        // Add Guide NPC
        map.npcs.push({
            x: map.startX + 1,
            y: map.startY,
            name: "Elder Aethel",
            dialogues: [
                "Welcome, traveler! The time fracture has thrown our world into chaos.",
                "The Dissonance lurks in the depths of the dungeon.",
                "You must find the Harmonic Core to restore balance.",
                "Be careful, the dungeon changes every time you enter.",
                "Good luck!"
            ],
            image: "assets/elder_portrait.png"
        });

        // Specific Villagers with unique personalities
        const villagers = [
            {
                name: "Barin the Blacksmith",
                dialogues: [
                    "Need your blade sharpened?",
                    "The forge keeps the cold at bay.",
                    "Steel is the only thing you can trust in these times.",
                    "I saw a strange shadow near the mines."
                ],
                image: "assets/barin_portrait.png"
            },
            {
                name: "Elara",
                dialogues: [
                    "The flowers are blooming despite the darkness.",
                    "Have you seen my cat?",
                    "It's quiet... too quiet.",
                    "Be careful out there, traveler."
                ],
                image: "assets/elara_portrait.png"
            },
            {
                name: "Healer Mila",
                dialogues: [
                    "Stay still, let me look at that wound.",
                    "I have herbs for most ailments, but not for the Dissonance.",
                    "Drink this tea, it will help with the chill.",
                    "Your spirit is strong."
                ],
                image: "assets/mila_portrait.png"
            },
            {
                name: "Guard Thorne",
                dialogues: [
                    "Move along.",
                    "I'm watching you.",
                    "The walls are safe. The outside is not.",
                    "Report any suspicious activity."
                ],
                image: "assets/thorne_portrait.png"
            },
            {
                name: "Farmer Rowan",
                dialogues: [
                    "Crops aren't growing like they used to.",
                    "The soil feels... different.",
                    "Honest work helps me sleep at night.",
                    "We need rain, but not the black rain."
                ],
                image: "assets/rowan_portrait.png"
            }
        ];

        for (const villager of villagers) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                // Try to place near houses or random spots (avoid 0,0)
                const vx = Math.floor(Math.random() * (map.width - 2)) + 1;
                const vy = Math.floor(Math.random() * (map.height - 2)) + 1;
                attempts++;

                // Check distance from player spawn
                const dist = Math.abs(vx - map.startX) + Math.abs(vy - map.startY);
                if (dist < 4) continue;

                // Check tile
                if (map.tiles[vy][vx] === 'floor' || map.tiles[vy][vx] === 'floor_grass') {
                    // Check for existing entities
                    const occupied = map.npcs.find(n => n.x === vx && n.y === vy);
                    if (!occupied) {
                        map.npcs.push({
                            x: vx,
                            y: vy,
                            name: villager.name,
                            dialogues: villager.dialogues,
                            image: villager.image
                        });
                        placed = true;
                    }
                }
            }
        }

        // Paths
        // Connect each house to center
        map.rooms.forEach(room => {
            const center = this.getCenter(room);
            let curX = center.x;
            let curY = center.y;
            // Move out of house first
            if (map.tiles[curY + Math.floor(room.h / 2)][curX] === 'door_closed') curY += Math.floor(room.h / 2) + 1;

            // Simple pathfinding to center
            while (curX !== cx || curY !== cy) {
                if (curX < cx) curX++;
                else if (curX > cx) curX--;

                if (curY < cy) curY++;
                else if (curY > cy) curY--;

                if (map.tiles[curY][curX] === 'floor_grass') {
                    map.tiles[curY][curX] = 'floor_dirt';
                }
            }
        });

        // Trees
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (map.tiles[y][x] === 'floor_grass') {
                    // Check for overlap with props/npcs
                    if (!map.props.find(p => p.x === x && p.y === y) && !map.npcs.find(n => n.x === x && n.y === y)) {
                        if (Math.random() < 0.05) {
                            map.props.push({ x, y, type: 'tree', char: 'T' });
                        }
                    }
                }
            }
        }

        this.placeHiddenTreasures(map);
        this.placeSpecialEntrances(map);

        return map;
    }

    placeHiddenTreasures(map: MapData) {
        // Find secluded spots (surrounded by obstacles on 3 sides)
        for (let y = 2; y < map.height - 2; y++) {
            for (let x = 2; x < map.width - 2; x++) {
                if (map.tiles[y][x] === 'floor_grass' || map.tiles[y][x] === 'floor') {
                    if (map.props.find(p => p.x === x && p.y === y)) continue;

                    let obstacles = 0;
                    if (this.isObstacle(map, x - 1, y)) obstacles++;
                    if (this.isObstacle(map, x + 1, y)) obstacles++;
                    if (this.isObstacle(map, x, y - 1)) obstacles++;
                    if (this.isObstacle(map, x, y + 1)) obstacles++;

                    if (obstacles >= 3) {
                        if (Math.random() < 0.15) { // 15% chance if secluded
                            map.props.push({ x, y, type: 'chest', char: 'C' });
                        }
                    }
                }
            }
        }
    }

    placeSpecialEntrances(map: MapData) {
        // 1. Cellar (Hidden in a house)
        if (map.rooms.length > 0) {
            const house = map.rooms[Math.floor(Math.random() * map.rooms.length)];
            const cx = house.x + 1;
            const cy = house.y + 1; // Corner
            // Check if free
            if (!map.props.find(p => p.x === cx && p.y === cy)) {
                map.props.push({ x: cx, y: cy, type: 'trapdoor', char: 'T' });
            }
        }

        // 2. Cave Entrance (Secluded outdoor)
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            const x = Math.floor(Math.random() * (map.width - 4)) + 2;
            const y = Math.floor(Math.random() * (map.height - 4)) + 2;
            if (map.tiles[y][x] === 'floor_grass') {
                // Check if near wall/tree for aesthetics
                if (this.isObstacle(map, x - 1, y) || this.isObstacle(map, x + 1, y) || this.isObstacle(map, x, y - 1)) {
                    if (!map.props.find(p => p.x === x && p.y === y)) {
                        map.props.push({ x, y, type: 'cave_entrance', char: '0' });
                        placed = true;
                    }
                }
            }
            attempts++;
        }
    }

    generateGraveyard(map: MapData) {
        // Find spot for 6x6 Graveyard
        const w = 8, h = 8;
        const pos = this.findFreeSpace(map, w, h);
        if (!pos) return;

        for (let y = pos.y; y < pos.y + h; y++) {
            for (let x = pos.x; x < pos.x + w; x++) {
                if (x === pos.x || x === pos.x + w - 1 || y === pos.y || y === pos.y + h - 1) {
                    map.tiles[y][x] = 'wall_wood'; // Fence
                } else {
                    map.tiles[y][x] = 'floor_dirt';
                    if (Math.random() < 0.2) map.props.push({ x, y, type: 'tombstone', char: '†' });
                }
            }
        }
        // Gate
        map.tiles[pos.y + h - 1][pos.x + Math.floor(w / 2)] = 'floor_dirt';
    }

    generateMarketplace(map: MapData) {
        const w = 10, h = 8;
        const pos = this.findFreeSpace(map, w, h);
        if (!pos) return;

        for (let y = pos.y; y < pos.y + h; y++) {
            for (let x = pos.x; x < pos.x + w; x++) {
                map.tiles[y][x] = 'floor_dirt'; // Plaza
            }
        }

        // Stalls
        map.props.push({ x: pos.x + 2, y: pos.y + 2, type: 'stall', char: 'S' });
        map.props.push({ x: pos.x + 6, y: pos.y + 2, type: 'stall', char: 'S' });
        map.props.push({ x: pos.x + 2, y: pos.y + 5, type: 'stall', char: 'S' });
        map.props.push({ x: pos.x + 6, y: pos.y + 5, type: 'stall', char: 'S' });

        // Merchant
        map.npcs.push({ x: pos.x + 4, y: pos.y + 4, name: "Merchant Glib", dialogues: ["Best prices!", "Fresh apples!"], image: "assets/merchant.png" });
    }

    generateTavern(map: MapData) {
        const w = 10, h = 8;
        const pos = this.findFreeSpace(map, w, h);
        if (!pos) return;

        // Building
        for (let y = pos.y; y < pos.y + h; y++) {
            for (let x = pos.x; x < pos.x + w; x++) {
                if (x === pos.x || x === pos.x + w - 1 || y === pos.y || y === pos.y + h - 1) map.tiles[y][x] = 'wall_wood';
                else map.tiles[y][x] = 'floor';
            }
        }
        map.tiles[pos.y + h - 1][pos.x + 5] = 'door_closed';

        // Props
        map.props.push({ x: pos.x + 2, y: pos.y + 2, type: 'table', char: 'T' });
        map.props.push({ x: pos.x + 7, y: pos.y + 2, type: 'table', char: 'T' });
        map.props.push({ x: pos.x + 2, y: pos.y + 5, type: 'table', char: 'T' });
        // Bar
        map.props.push({ x: pos.x + 7, y: pos.y + 5, type: 'crate', char: 'B' });

        // Innkeeper
        map.npcs.push({ x: pos.x + 8, y: pos.y + 5, name: "Innkeeper Bess", dialogues: ["Warm hearth, cold ale.", "Stay a while."], image: "assets/innkeeper.png" });
    }

    generateBlacksmith(map: MapData) {
        const w = 8, h = 6;
        const pos = this.findFreeSpace(map, w, h);
        if (!pos) return;

        for (let y = pos.y; y < pos.y + h; y++) {
            for (let x = pos.x; x < pos.x + w; x++) {
                map.tiles[y][x] = 'floor_dirt';
            }
        }
        // Roof over forge only (pillars)
        map.props.push({ x: pos.x + 1, y: pos.y + 1, type: 'anvil', char: 'A' });
        map.props.push({ x: pos.x + 1, y: pos.y + 3, type: 'fireplace', char: 'F' }); // Forge
        map.props.push({ x: pos.x + 5, y: pos.y + 2, type: 'chest', char: 'C' });

        map.npcs.push({ x: pos.x + 3, y: pos.y + 2, name: "Smith Gorr", dialogues: ["Iron never lies.", "Need repairs?"], image: "assets/smith.png" });
    }

    generatePond(map: MapData) {
        const w = 12, h = 10;
        const pos = this.findFreeSpace(map, w, h);
        if (!pos) return;

        // Irregular pond
        for (let y = pos.y; y < pos.y + h; y++) {
            for (let x = pos.x; x < pos.x + w; x++) {
                const dx = x - (pos.x + w / 2);
                const dy = y - (pos.y + h / 2);
                if ((dx * dx) / (w / 2 * w / 2) + (dy * dy) / (h / 2 * h / 2) <= 1 + (Math.random() * 0.2 - 0.1)) {
                    map.tiles[y][x] = 'water';
                }
            }
        }
        // Pier
        map.props.push({ x: pos.x + Math.floor(w / 2), y: pos.y + h - 2, type: 'pier', char: 'P' });
        map.npcs.push({ x: pos.x + Math.floor(w / 2), y: pos.y + h - 2, name: "Fisher Tom", dialogues: ["Big one got away.", "Quiet day."], image: "assets/fisher.png" });
    }

    findFreeSpace(map: MapData, w: number, h: number): { x: number, y: number } | null {
        for (let tries = 0; tries < 50; tries++) {
            const x = Math.floor(Math.random() * (map.width - w - 2)) + 1;
            const y = Math.floor(Math.random() * (map.height - h - 2)) + 1;
            let clear = true;
            for (let ky = y - 1; ky < y + h + 1; ky++) {
                for (let kx = x - 1; kx < x + w + 1; kx++) {
                    if (map.tiles[ky][kx] !== 'floor_grass') { clear = false; break; }
                    if (map.props.some(p => p.x === kx && p.y === ky)) { clear = false; break; }
                }
                if (!clear) break;
            }
            if (clear) return { x, y };
        }
        return null; // Search failed
    }

    isObstacle(map: MapData, x: number, y: number): boolean {
        const t = map.tiles[y][x];
        const hasProp = map.props.some(p => p.x === x && p.y === y);
        return t === 'wall' || t === 'wall_wood' || (t === 'floor_grass' && hasProp); // Tree on grass counts as obstacle
    }

    // ... (rest of generate methods unchanged) ...

    generateDungeon(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [], // Store rooms for spawning entities later
            props: [],
            npcs: []
        };

        // Initialize with walls
        for (let y = 0; y < this.height; y++) {
            const row: string[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push('wall');
            }
            map.tiles.push(row);
        }

        this.rooms = [];
        // Scale maxRooms based on map area (approx 1 room per 150 tiles)
        const area = this.width * this.height;
        const maxRooms = Math.floor(area / 150);
        const minRoomSize = 6;
        const maxRoomSize = 15; // Slightly larger rooms possible

        for (let i = 0; i < maxRooms; i++) {
            const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            const x = Math.floor(Math.random() * (this.width - w - 1)) + 1;
            const y = Math.floor(Math.random() * (this.height - h - 1)) + 1;

            const newRoom: Room = { x, y, w, h };

            // Check overlap
            let failed = false;
            for (const otherRoom of this.rooms) {
                if (
                    newRoom.x <= otherRoom.x + otherRoom.w &&
                    newRoom.x + newRoom.w >= otherRoom.x &&
                    newRoom.y <= otherRoom.y + otherRoom.h &&
                    newRoom.y + newRoom.h >= otherRoom.y
                ) {
                    failed = true;
                    break;
                }
            }

            if (!failed) {
                this.createRoom(newRoom, map);

                if (this.rooms.length > 0) {
                    const prevRoom = this.rooms[this.rooms.length - 1];
                    const newCenter = this.getCenter(newRoom);
                    const prevCenter = this.getCenter(prevRoom);

                    if (Math.random() < 0.5) {
                        this.createHCorridor(prevCenter.x, newCenter.x, prevCenter.y, map);
                        this.createVCorridor(prevCenter.y, newCenter.y, newCenter.x, map);
                    } else {
                        this.createVCorridor(prevCenter.y, newCenter.y, prevCenter.x, map);
                        this.createHCorridor(prevCenter.x, newCenter.x, newCenter.y, map);
                    }
                }

                this.rooms.push(newRoom);
                map.rooms.push(newRoom);
            }
        }

        this.placeDoors(map);

        // Place Stairs in the last room
        if (this.rooms.length > 0) {
            const lastRoom = this.rooms[this.rooms.length - 1];
            const center = this.getCenter(lastRoom);
            map.tiles[center.y][center.x] = 'stairs';
        }

        return map;
    }

    createRoom(room: Room, map: MapData) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                map.tiles[y][x] = 'floor';
            }
        }
    }

    createHCorridor(x1: number, x2: number, y: number, map: MapData) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (map.tiles[y][x] === 'wall') {
                map.tiles[y][x] = 'floor';
            } else {
                map.tiles[y][x] = 'floor';
            }
            // Add Torch (decoration)
            if (Math.random() < 0.15) {
                // Check north wall
                if (map.tiles[y - 1] && map.tiles[y - 1][x] === 'wall') {
                    map.props.push({ x, y: y - 1, type: 'torch', char: 'i' });
                }
            }
        }
    }

    createVCorridor(y1: number, y2: number, x: number, map: MapData) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (map.tiles[y][x] === 'wall') {
                map.tiles[y][x] = 'floor';
            } else {
                map.tiles[y][x] = 'floor';
            }
            // Add Torch
            if (Math.random() < 0.15) {
                // Check west wall
                if (map.tiles[y][x - 1] === 'wall') {
                    map.props.push({ x: x - 1, y, type: 'torch', char: 'i' });
                }
            }
        }
    }

    placeDoors(map: MapData) {
        // Simple heuristic: If a floor tile has walls on two opposite sides and floor on the other two, it might be a doorway.
        // And it should be at the edge of a room.
        for (const room of map.rooms) {
            // Check top and bottom edges
            for (let x = room.x; x < room.x + room.w; x++) {
                if (map.tiles[room.y - 1] && map.tiles[room.y - 1][x] === 'floor') {
                    if (Math.random() < 0.3) map.tiles[room.y - 1][x] = 'door_closed';
                }
                if (map.tiles[room.y + room.h] && map.tiles[room.y + room.h][x] === 'floor') {
                    if (Math.random() < 0.3) map.tiles[room.y + room.h][x] = 'door_closed';
                }
            }
            // Check left and right edges
            for (let y = room.y; y < room.y + room.h; y++) {
                if (map.tiles[y][room.x - 1] === 'floor') {
                    if (Math.random() < 0.3) map.tiles[y][room.x - 1] = 'door_closed';
                }
                if (map.tiles[y][room.x + room.w] === 'floor') {
                    if (Math.random() < 0.3) map.tiles[y][room.x + room.w] = 'door_closed';
                }
            }
        }
    }

    getCenter(room: Room) {
        return {
            x: Math.floor(room.x + room.w / 2),
            y: Math.floor(room.y + room.h / 2)
        };
    }

    decorateMap(map: MapData) {
        // Furnish Rooms
        for (const room of map.rooms) {
            this.furnishRoom(room, map);
        }

        // Floor Decorations (Corridors/Remaining space)
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.tiles[y][x] === 'floor' && !map.props.find(p => p.x === x && p.y === y)) {
                    // 5% chance for random clutter in corridors
                    if (Math.random() < 0.05) {
                        const rand = Math.random();
                        let type = 'rubble';
                        let char = '🪨';

                        if (rand < 0.2) { type = 'bones'; char = '💀'; }
                        else if (rand < 0.4) { type = 'grass'; char = '🌿'; }
                        else if (rand < 0.5) { type = 'web'; char = '🕸️'; } // Web on floor? Maybe better in corners.

                        map.props.push({ x, y, type, char });
                    }
                }
            }
        }

        // Wall Decorations (Torches & Banners & Webs)
        for (let y = 1; y < map.height - 1; y++) {
            for (let x = 1; x < map.width - 1; x++) {
                if (map.tiles[y][x] === 'wall') {
                    // Check neighbors for corners (Webs)
                    let floorNeighbors = 0;
                    if (map.tiles[y + 1][x] === 'floor') floorNeighbors++;
                    if (map.tiles[y - 1][x] === 'floor') floorNeighbors++;
                    if (map.tiles[y][x + 1] === 'floor') floorNeighbors++;
                    if (map.tiles[y][x - 1] === 'floor') floorNeighbors++;

                    if (floorNeighbors > 0) {
                        // Torches/Banners on front facing walls
                        if (map.tiles[y + 1][x] === 'floor') {
                            const rand = Math.random();
                            if (rand < 0.1) {
                                map.props.push({ x, y, type: 'torch', char: '🔥' });
                            } else if (rand < 0.15) {
                                map.props.push({ x, y, type: 'banner', char: '🚩' });
                            }
                        }
                        // Webs in corners (walls with > 2 wall neighbors, but exposed to floor)
                        // Simplified: Random web on wall
                        if (Math.random() < 0.02) {
                            map.props.push({ x, y, type: 'web', char: '🕸️' });
                        }
                    }
                }
            }
        }

        // Tile Variations
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                if (tile === 'floor') {
                    const rand = Math.random();
                    // 15% chance for mossy floor
                    if (rand < 0.15) map.tiles[y][x] = 'floor_moss';
                } else if (tile === 'wall') {
                    const rand = Math.random();
                    // 15% chance for cracked wall
                    if (rand < 0.15) map.tiles[y][x] = 'wall_cracked';
                }
            }
        }
    }

    furnishRoom(room: Room, map: MapData) {
        const rand = Math.random();
        const center = this.getCenter(room);

        // Don't block stairs (usually in last room, but safe check)
        if (map.tiles[center.y][center.x] === 'stairs') return;

        if (rand < 0.3) {
            // Dining Room
            // Table in center
            map.props.push({ x: center.x, y: center.y, type: 'table', char: '🪑' });

            // Chairs around
            if (map.tiles[center.y - 1][center.x] === 'floor') map.props.push({ x: center.x, y: center.y - 1, type: 'chair', char: '🪑' });
            if (map.tiles[center.y + 1][center.x] === 'floor') map.props.push({ x: center.x, y: center.y + 1, type: 'chair', char: '🪑' });
            if (map.tiles[center.y][center.x - 1] === 'floor') map.props.push({ x: center.x - 1, y: center.y, type: 'chair', char: '🪑' });
            if (map.tiles[center.y][center.x + 1] === 'floor') map.props.push({ x: center.x + 1, y: center.y, type: 'chair', char: '🪑' });

        } else if (rand < 0.5) {
            // Storage Room
            // Place crates/barrels along walls
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x === room.x || x === room.x + room.w - 1 || y === room.y || y === room.y + room.h - 1) {
                        // Edge of room (but inside)
                        if (map.tiles[y][x] === 'floor' && Math.random() < 0.4) {
                            const type = Math.random() < 0.6 ? 'crate' : 'barrel';
                            const char = type === 'crate' ? '📦' : '🛢️';
                            // Check if blocked
                            if (!map.props.find(p => p.x === x && p.y === y)) {
                                map.props.push({ x, y, type, char });
                            }
                        }
                    }
                }
            }
        } else if (rand < 0.7) {
            // Library
            // Bookshelves along walls
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if ((x === room.x || x === room.x + room.w - 1) && y !== room.y + Math.floor(room.h / 2)) { // Side walls only, leave path logic alone hopefully
                        if (map.tiles[y][x] === 'floor' && Math.random() < 0.6) {
                            if (!map.props.find(p => p.x === x && p.y === y)) {
                                map.props.push({ x, y, type: 'bookshelf', char: '📚' });
                            }
                        }
                    }
                }
            }
            // Table in middle
            map.props.push({ x: center.x, y: center.y, type: 'table', char: '🪑' });
        } else if (rand < 0.85) {
            // Bedroom / Quarters
            // Chests at foot of beds?
            if (map.tiles[room.y + 2][room.x + 1] === 'floor') map.props.push({ x: room.x + 1, y: room.y + 2, type: 'chest', char: 'C' });
        }
    }



    findValidSpawn(map: MapData) {
        // 1. Check if current start pos is valid (e.g. set by generateVillage)
        if (map.startX !== undefined && map.startY !== undefined) {
            if (this.isValidSpawn(map, map.startX, map.startY)) return;
        }

        // 2. Try Rooms (Center of first random room)
        if (map.rooms.length > 0) {
            // Try a few rooms
            for (let i = 0; i < Math.min(map.rooms.length, 5); i++) {
                const room = map.rooms[i];
                const c = this.getCenter(room);
                if (this.isValidSpawn(map, c.x, c.y)) {
                    map.startX = c.x;
                    map.startY = c.y;
                    return;
                }
            }
        }

        // 3. Spiral Scan from Center
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        const maxR = Math.max(map.width, map.height);

        for (let r = 1; r < maxR; r++) {
            // Simple scan of the box boundary at radius r
            for (let y = cy - r; y <= cy + r; y++) {
                for (let x = cx - r; x <= cx + r; x++) {
                    // Start from center-ish by checking ring
                    if (Math.abs(x - cx) !== r && Math.abs(y - cy) !== r) continue;

                    if (this.isValidSpawn(map, x, y)) {
                        map.startX = x;
                        map.startY = y;
                        return;
                    }
                }
            }
        }
        // Fallback (Should be rare)
        map.startX = cx;
        map.startY = cy;
    }

    isValidSpawn(map: MapData, x: number, y: number): boolean {
        if (x < 1 || x >= map.width - 1 || y < 1 || y >= map.height - 1) return false;
        const t = map.tiles[y][x];
        // Walkable tiles
        const walkable = ['floor', 'floor_grass', 'floor_dirt', 'floor_moss', 'floor_cracked'];
        if (!walkable.includes(t)) return false;

        // Visual obstruction check (no props, no npcs)
        if (map.props.some(p => p.x === x && p.y === y)) return false;
        if (map.npcs.some(n => n.x === x && n.y === y)) return false;

        return true;
    }
}
