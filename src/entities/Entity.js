export default class Entity {
    constructor(x, y, char, color) {
        this.x = x;
        this.y = y;
        this.drawX = x;
        this.drawY = y;
        this.char = char;
        this.color = color;
    }

    move(dx, dy, map) {
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
