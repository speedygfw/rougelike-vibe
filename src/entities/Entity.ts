export default class Entity {
    x: number;
    y: number;
    drawX: number;
    drawY: number;
    char: string;
    color: string;

    constructor(x: number, y: number, char: string, color: string) {
        this.x = x;
        this.y = y;
        this.drawX = x;
        this.drawY = y;
        this.char = char;
        this.color = color;
    }

    move(dx: number, dy: number, map: any): boolean {
        const newX = this.x + dx;
        const newY = this.y + dy;

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
