import { getRandomTheme } from './Theme.js';

export interface MapData {
    width: number;
    height: number;
    tiles: string[][];
    rooms: Room[];
    props: Prop[];
    theme?: any;
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
        this.decorateMap(map);
        map.theme = getRandomTheme();
        return map;
    }

    generateCaves(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [], // Caves don't have explicit rooms
            props: []
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

    generateDungeon(): MapData {
        const map: MapData = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [], // Store rooms for spawning entities later
            props: []
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
        const maxRooms = 10;
        const minRoomSize = 6;
        const maxRoomSize = 12;

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
        // Floor Decorations
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.tiles[y][x] === 'floor') {
                    // 5% chance for floor decoration
                    if (Math.random() < 0.05) {
                        const rand = Math.random();
                        let type = 'rubble';
                        let char = '🪨';

                        if (rand < 0.3) { type = 'bones'; char = '💀'; }
                        else if (rand < 0.6) { type = 'grass'; char = '🌿'; }

                        // Ensure no entity or item is here (simple check, can be improved)
                        map.props.push({ x, y, type, char });
                    }
                }
            }
        }

        // Wall Decorations (Torches & Banners)
        for (let y = 1; y < map.height - 1; y++) {
            for (let x = 1; x < map.width - 1; x++) {
                if (map.tiles[y][x] === 'wall') {
                    // Check if adjacent to floor (south)
                    // Torches and banners look best on "front facing" walls (north of a floor tile)
                    if (map.tiles[y + 1][x] === 'floor') {
                        const rand = Math.random();
                        if (rand < 0.1) {
                            map.props.push({ x, y, type: 'torch', char: '🔥' });
                        } else if (rand < 0.15) {
                            map.props.push({ x, y, type: 'banner', char: '🚩' });
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
}
