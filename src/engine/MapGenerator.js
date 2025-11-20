export default class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.rooms = [];
    }

    generate() {
        const map = {
            width: this.width,
            height: this.height,
            tiles: [],
            rooms: [] // Store rooms for spawning entities later
        };

        // Initialize with walls
        for (let y = 0; y < this.height; y++) {
            const row = [];
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

            const newRoom = { x, y, w, h };

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

        // Place Stairs in the last room
        if (this.rooms.length > 0) {
            const lastRoom = this.rooms[this.rooms.length - 1];
            const center = this.getCenter(lastRoom);
            map.tiles[center.y][center.x] = 'stairs';
        }

        return map;
    }

    createRoom(room, map) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                map.tiles[y][x] = 'floor';
            }
        }
    }

    createHCorridor(x1, x2, y, map) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            map.tiles[y][x] = 'floor';
        }
    }

    createVCorridor(y1, y2, x, map) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            map.tiles[y][x] = 'floor';
        }
    }

    getCenter(room) {
        return {
            x: Math.floor(room.x + room.w / 2),
            y: Math.floor(room.y + room.h / 2)
        };
    }
}
