import { getRandomTheme } from './Theme.js';

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

    generate(): MapData {
        let map: MapData;
        if (Math.random() < 0.5) {
            map = this.generateDungeon();
        } else {
            map = this.generateCaves();
        }
        map.theme = getRandomTheme();
        this.decorateMap(map);
        return map;
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

    generateVillage(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [],
            props: [],
            npcs: []
        };

        // Fill with grass
        for (let y = 0; y < this.height; y++) {
            const row: string[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push('floor_grass');
            }
            map.tiles.push(row);
        }

        // Create Walls around the village
        for (let x = 0; x < this.width; x++) {
            map.tiles[0][x] = 'wall';
            map.tiles[this.height - 1][x] = 'wall';
        }
        for (let y = 0; y < this.height; y++) {
            map.tiles[y][0] = 'wall';
            map.tiles[y][this.width - 1] = 'wall';
        }

        // Create Houses
        const houseCount = 6;
        for (let i = 0; i < houseCount; i++) {
            const w = 6 + Math.floor(Math.random() * 6);
            const h = 6 + Math.floor(Math.random() * 6);
            const x = 5 + Math.floor(Math.random() * (this.width - 10 - w));
            const y = 5 + Math.floor(Math.random() * (this.height - 10 - h));

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

                // Furnish Room
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

                // Dresser
                if (Math.random() < 0.6) {
                    const dx = x + w - 2;
                    const dy = y + Math.floor(h / 2);
                    if (map.tiles[dy][dx] === 'floor') {
                        map.props.push({ x: dx, y: dy, type: 'dresser', char: 'D' });
                    }
                }
            }
        }

        // Dungeon Entrance (Stairs)
        let cx = Math.floor(this.width / 2);
        let cy = Math.floor(this.height / 2);
        while (map.tiles[cy][cx] !== 'floor_grass') {
            cx++;
        }
        map.tiles[cy][cx] = 'stairs';

        // Place Well near center
        map.props.push({ x: cx - 2, y: cy + 2, type: 'well', char: 'O' });

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
            name: "Village Elder",
            dialogues: [
                "Welcome, traveler! The time fracture has thrown our world into chaos.",
                "The Dissonance lurks in the depths of the dungeon.",
                "You must find the Harmonic Core to restore balance.",
                "Be careful, the dungeon changes every time you enter.",
                "Good luck!"
            ],
            image: "assets/elder.svg"
        });

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
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (map.tiles[y][x] === 'floor_grass') {
                    if (Math.random() < 0.05) {
                        map.props.push({ x, y, type: 'tree', char: 'T' });
                    }
                }
            }
        }

        return map;
    }

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
                // Chance to place door if connecting to a room (simplified check)
                // In a real implementation, we'd check if we're entering/exiting a room
            } else {
                map.tiles[y][x] = 'floor';
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

        if (rand < 0.4) {
            // Dining Room
            // Table in center
            map.props.push({ x: center.x, y: center.y, type: 'table', char: '🪑' });

            // Chairs around
            if (map.tiles[center.y - 1][center.x] === 'floor') map.props.push({ x: center.x, y: center.y - 1, type: 'chair', char: '🪑' });
            if (map.tiles[center.y + 1][center.x] === 'floor') map.props.push({ x: center.x, y: center.y + 1, type: 'chair', char: '🪑' });
            if (map.tiles[center.y][center.x - 1] === 'floor') map.props.push({ x: center.x - 1, y: center.y, type: 'chair', char: '🪑' });
            if (map.tiles[center.y][center.x + 1] === 'floor') map.props.push({ x: center.x + 1, y: center.y, type: 'chair', char: '🪑' });

        } else if (rand < 0.7) {
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
        }
    }
}
