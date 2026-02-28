import { Game } from '../core/Game';
import { Particle } from './Particle';

export const TILE_SIZE = 25;
export const ROWS = 26;
export const COLS = 26;

// 0: empty, 1: brick, 2: steel
const levelData = [
    "00000000000000000000000000",
    "00000000000000000000000000",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011001122221100110011",
    "00110011001122221100110011",
    "00000000000000000000000000",
    "00000000000000000000000000",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00002200000000000000220000",
    "00002200000000000000220000",
    "22000000111100001111000022",
    "22000000111100001111000022",
    "00000000000000000000000000",
    "00000000000000000000000000",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011001100001100110011",
    "00110011000000000000110011",
    "00110011000111100000110011",
    "00000000000100100000000000",
    "00000000000100100000000000"
];

export class Map {
    public grid: number[][] = [];
    public baseAlive: boolean = true;
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public loadLevel() {
        this.grid = [];
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = parseInt(levelData[r].charAt(c), 10);
            }
        }
        this.baseAlive = true;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const type = this.grid[r][c];

                if (type === 1) {
                    // --- Brick Wall Segment (Wasteland style) ---
                    // Base clay color
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    // Brick mortar lines
                    ctx.strokeStyle = '#3c1e08';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 4; i++) {
                        let by = y + i * (TILE_SIZE / 4);
                        ctx.beginPath();
                        ctx.moveTo(x, by);
                        ctx.lineTo(x + TILE_SIZE, by);
                        ctx.stroke();
                        // Vertical mortar
                        let xOffset = (i % 2 === 0) ? TILE_SIZE / 2 : TILE_SIZE / 4;
                        ctx.beginPath();
                        ctx.moveTo(x + xOffset, by);
                        ctx.lineTo(x + xOffset, by + TILE_SIZE / 4);
                        if (i % 2 !== 0) {
                            ctx.moveTo(x + xOffset + TILE_SIZE / 2, by);
                            ctx.lineTo(x + xOffset + TILE_SIZE / 2, by + TILE_SIZE / 4);
                        }
                        ctx.stroke();
                    }
                    // Weathering / Shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);

                } else if (type === 2) {
                    // --- Concrete Road Barrier ---
                    // Base ash gray
                    ctx.fillStyle = '#6b6e6b';
                    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    // Top highlight (sloped barrier)
                    ctx.fillStyle = '#8f928e';
                    ctx.beginPath();
                    ctx.moveTo(x + 2, y + 2);
                    ctx.lineTo(x + TILE_SIZE - 2, y + 2);
                    ctx.lineTo(x + TILE_SIZE - 6, y + 8);
                    ctx.lineTo(x + 6, y + 8);
                    ctx.fill();
                    // Dark side / shadow
                    ctx.fillStyle = '#424542';
                    ctx.fillRect(x + 2, y + TILE_SIZE - 8, TILE_SIZE - 4, 6);
                    // Barrier top rib
                    ctx.fillStyle = '#9aa09b';
                    ctx.fillRect(x + 8, y + 6, TILE_SIZE - 16, TILE_SIZE - 12);
                }
            }
        }

        // --- Base Fortress (Fortified Eagle Nest) ---
        const baseX = 12 * TILE_SIZE;
        const baseY = 24 * TILE_SIZE;

        if (this.baseAlive) {
            const bw = TILE_SIZE * 2;
            const bh = TILE_SIZE * 2;
            const pad = 8;

            // 1. Outer Sandbag Perimeter
            ctx.fillStyle = '#a8894f';
            ctx.fillRect(baseX - pad, baseY - pad, bw + pad * 2, bh + pad * 2);
            ctx.strokeStyle = '#7a6540';
            ctx.lineWidth = 1.5;
            ctx.fillStyle = '#c4a86c';
            // Top sandbag row
            for (let sx = baseX - pad; sx < baseX + bw + pad; sx += 10) {
                ctx.beginPath();
                ctx.ellipse(sx + 5, baseY - pad + 4, 5, 3, 0, Math.PI, 0);
                ctx.fill(); ctx.stroke();
            }
            // Bottom sandbag row
            for (let sx = baseX - pad; sx < baseX + bw + pad; sx += 10) {
                ctx.beginPath();
                ctx.ellipse(sx + 5, baseY + bh + pad - 4, 5, 3, 0, 0, Math.PI);
                ctx.fill(); ctx.stroke();
            }
            // Left sandbag row
            for (let sy = baseY - pad; sy < baseY + bh + pad; sy += 10) {
                ctx.beginPath();
                ctx.ellipse(baseX - pad + 4, sy + 5, 3, 5, 0, Math.PI * 1.5, Math.PI * 0.5);
                ctx.fill(); ctx.stroke();
            }
            // Right sandbag row
            for (let sy = baseY - pad; sy < baseY + bh + pad; sy += 10) {
                ctx.beginPath();
                ctx.ellipse(baseX + bw + pad - 4, sy + 5, 3, 5, 0, Math.PI * 0.5, Math.PI * 1.5);
                ctx.fill(); ctx.stroke();
            }

            // 2. Concrete Fortress Shell (FULL enclosed rectangle)
            const wallThick = 6;
            ctx.fillStyle = '#6a6d68';
            ctx.fillRect(baseX, baseY, bw, bh);
            // Top wall highlight
            ctx.fillStyle = '#8a8d85';
            ctx.fillRect(baseX, baseY, bw, wallThick);
            // Bottom wall shadow
            ctx.fillStyle = '#4a4d48';
            ctx.fillRect(baseX, baseY + bh - wallThick, bw, wallThick);
            // Left wall
            ctx.fillStyle = '#777a74';
            ctx.fillRect(baseX, baseY, wallThick, bh);
            // Right wall
            ctx.fillStyle = '#5d605a';
            ctx.fillRect(baseX + bw - wallThick, baseY, wallThick, bh);
            // Corner rivets
            ctx.fillStyle = '#333';
            [[baseX + 4, baseY + 4], [baseX + bw - 4, baseY + 4],
            [baseX + 4, baseY + bh - 4], [baseX + bw - 4, baseY + bh - 4]].forEach(([rx, ry]) => {
                ctx.beginPath();
                ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            // Wall outline
            ctx.strokeStyle = '#3a3d38';
            ctx.lineWidth = 2;
            ctx.strokeRect(baseX + 1, baseY + 1, bw - 2, bh - 2);

            // 3. Inner Dark Pit
            const innerPad = wallThick + 2;
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(baseX + innerPad, baseY + innerPad, bw - innerPad * 2, bh - innerPad * 2);

            // 4. Eagle Symbol
            const cx = baseX + bw / 2;
            const cy = baseY + bh / 2;
            ctx.fillStyle = '#d3a339';
            ctx.strokeStyle = '#8b6914';
            ctx.lineWidth = 1;
            // Head
            ctx.beginPath();
            ctx.arc(cx, cy - 8, 4, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // Body
            ctx.beginPath();
            ctx.moveTo(cx, cy - 4);
            ctx.lineTo(cx + 4, cy + 6);
            ctx.lineTo(cx - 4, cy + 6);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Left Wing
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy - 2);
            ctx.lineTo(cx - 16, cy - 8);
            ctx.lineTo(cx - 14, cy - 3);
            ctx.lineTo(cx - 4, cy + 2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Right Wing
            ctx.beginPath();
            ctx.moveTo(cx + 3, cy - 2);
            ctx.lineTo(cx + 16, cy - 8);
            ctx.lineTo(cx + 14, cy - 3);
            ctx.lineTo(cx + 4, cy + 2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Tail
            ctx.beginPath();
            ctx.moveTo(cx - 6, cy + 6);
            ctx.lineTo(cx + 6, cy + 6);
            ctx.lineTo(cx + 4, cy + 10);
            ctx.lineTo(cx - 4, cy + 10);
            ctx.closePath();
            ctx.fill();

        } else {
            // Destroyed Base (Rubble crater)
            ctx.fillStyle = '#2a2825';
            ctx.fillRect(baseX - 8, baseY - 8, TILE_SIZE * 2 + 16, TILE_SIZE * 2 + 16);
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(baseX + TILE_SIZE, baseY + TILE_SIZE, TILE_SIZE - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(baseX + 10, baseY + 10);
            ctx.lineTo(baseX + 30, baseY + 40);
            ctx.moveTo(baseX + 40, baseY + 15);
            ctx.lineTo(baseX + 15, baseY + 45);
            ctx.stroke();
        }
    }

    public collides(x: number, y: number, w: number, h: number): boolean {
        if (x < 0 || x + w > COLS * TILE_SIZE || y < 0 || y + h > ROWS * TILE_SIZE) {
            return true;
        }

        const startCol = Math.floor(x / TILE_SIZE);
        const endCol = Math.floor((x + w - 0.1) / TILE_SIZE);
        const startRow = Math.floor(y / TILE_SIZE);
        const endRow = Math.floor((y + h - 0.1) / TILE_SIZE);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const type = this.grid[r][c];
                if (type === 1 || type === 2) {
                    return true;
                }
            }
        }

        const baseX = 12 * TILE_SIZE;
        const baseY = 24 * TILE_SIZE;
        if (
            this.baseAlive &&
            x < baseX + TILE_SIZE * 2 && x + w > baseX &&
            y < baseY + TILE_SIZE * 2 && y + h > baseY
        ) {
            return true;
        }

        return false;
    }

    public destroyTile(x: number, y: number, w: number, h: number, canDestroySteel: boolean): boolean {
        let hit = false;
        const startCol = Math.floor(x / TILE_SIZE);
        const endCol = Math.floor((x + w - 0.1) / TILE_SIZE);
        const startRow = Math.floor(y / TILE_SIZE);
        const endRow = Math.floor((y + h - 0.1) / TILE_SIZE);

        // Track the actual tile row/col that got hit, to prevent hitting multiple
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    const type = this.grid[r][c];
                    if (type === 1) {
                        this.grid[r][c] = 0;
                        hit = true;
                        // Spawn brick particles
                        for (let i = 0; i < 8; i++) {
                            const colors = ['#8b4513', '#a0522d', '#cd853f'];
                            this.game.addEntity(new Particle(this.game, c * TILE_SIZE + 12, r * TILE_SIZE + 12, colors[Math.floor(Math.random() * 3)], 0.8, 1, 'rect'));
                        }
                    } else if (type === 2) {
                        if (canDestroySteel) {
                            this.grid[r][c] = 0;
                            // Spawn steel block pieces
                            for (let i = 0; i < 10; i++) {
                                const colors = ['#6b6e6b', '#8f928e', '#424542'];
                                this.game.addEntity(new Particle(this.game, c * TILE_SIZE + 12, r * TILE_SIZE + 12, colors[Math.floor(Math.random() * 3)], 1, 1.2, 'rect'));
                            }
                        }
                        hit = true;
                        // Spark on steel hit
                        for (let i = 0; i < 5; i++) {
                            this.game.addEntity(new Particle(this.game, c * TILE_SIZE + 12, r * TILE_SIZE + 12, '#fff', 1.5, 1, 'spark'));
                        }
                    }
                }
            }
        }

        const baseX = 12 * TILE_SIZE;
        const baseY = 24 * TILE_SIZE;
        if (
            this.baseAlive &&
            x < baseX + TILE_SIZE * 2 && x + w > baseX &&
            y < baseY + TILE_SIZE * 2 && y + h > baseY
        ) {
            this.baseAlive = false;
            this.game.gameOver();
            hit = true;
        }

        return hit;
    }
}
