export default class FOV {
    map: any;
    visible: Set<string>;
    multipliers: number[][];

    constructor(map: any) {
        this.map = map;
        this.visible = new Set();
        this.multipliers = [
            [1, 0, 0, -1, -1, 0, 0, 1],
            [0, 1, -1, 0, 0, -1, 1, 0],
            [0, 1, 1, 0, 0, -1, -1, 0],
            [1, 0, 0, 1, -1, 0, 0, -1]
        ];
    }

    compute(px: number, py: number, radius: number) {
        this.visible.clear();
        this.visible.add(`${px},${py}`);

        for (let i = 0; i < 8; i++) {
            this.castLight(px, py, 1, 1.0, 0.0, radius, this.multipliers[0][i], this.multipliers[1][i], this.multipliers[2][i], this.multipliers[3][i]);
        }

        return this.visible;
    }

    castLight(cx: number, cy: number, row: number, start: number, end: number, radius: number, xx: number, xy: number, yx: number, yy: number) {
        if (start < end) return;

        let radiusSq = radius * radius;

        for (let j = row; j <= radius; j++) {
            let dx = -j - 1;
            let dy = -j;
            let blocked = false;
            let newStart = 0;

            while (dx <= 0) {
                dx++;
                let X = cx + dx * xx + dy * xy;
                let Y = cy + dx * yx + dy * yy;
                let l_slope = (dx - 0.5) / (dy + 0.5);
                let r_slope = (dx + 0.5) / (dy - 0.5);

                if (start < r_slope) continue;
                if (end > l_slope) break;

                if (dx * dx + dy * dy < radiusSq) {
                    if (X >= 0 && X < this.map.width && Y >= 0 && Y < this.map.height) {
                        this.visible.add(`${X},${Y}`);
                    }
                }

                if (blocked) {
                    if (this.isBlocked(X, Y)) {
                        newStart = r_slope;
                        continue;
                    } else {
                        blocked = false;
                        start = newStart;
                    }
                } else {
                    if (this.isBlocked(X, Y) && j < radius) {
                        blocked = true;
                        this.castLight(cx, cy, j + 1, start, l_slope, radius, xx, xy, yx, yy);
                        newStart = r_slope;
                    }
                }
            }
            if (blocked) break;
        }
    }

    isBlocked(x: number, y: number) {
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) return true;
        return this.map.tiles[y][x] === 'wall';
    }

}
