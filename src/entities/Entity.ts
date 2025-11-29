export default class Entity {
    x: number;
    y: number;
    drawX: number;
    drawY: number;
    char: string;
    color: string;

    facing: number; // 0: South, 1: West, 2: North, 3: East

    constructor(x: number, y: number, char: string, color: string) {
        this.x = x;
        this.y = y;
        this.drawX = x;
        this.drawY = y;
        this.char = char;
        this.color = color;
        this.facing = 0;
    }

    move(dx: number, dy: number, map: any): boolean {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Update facing
        if (dy > 0) this.facing = 0;
        else if (dx < 0) this.facing = 1;
        else if (dy < 0) this.facing = 2;
        else if (dx > 0) this.facing = 3;

        if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
            if (map.tiles[newY][newX] !== 'wall') {
                this.x = newX;
                this.y = newY;
                return true;
            }
        }
        return false;
    }
}
