import { Game } from '../core/Game';
import { Particle } from './Particle';
import { AudioEngine } from '../core/Audio';

export const TILE_SIZE = 25;
export const ROWS = 26;
export const COLS = 26;

// 0: empty, 1: brick, 2: steel, 3: bush, 4: river

export class Map {
    public grid: number[][] = [];
    public baseAlive: boolean = true;
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public loadLevel() {
        this.grid = [];
        this.baseAlive = true;

        const stage = this.game.stage;

        // initialize empty
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = 0;
            }
        }

        // Generate base protection
        for (let r = 22; r <= 25; r++) {
            this.grid[r][10] = 1; // Left wall (cols 10, 11)
            this.grid[r][11] = 1;
            this.grid[r][14] = 1; // Right wall (cols 14, 15)
            this.grid[r][15] = 1;
        }
        for (let c = 12; c <= 13; c++) {
            this.grid[22][c] = 1; // Top wall (rows 22, 23)
            this.grid[23][c] = 1;
            // Base itself 24-25, 12-13, keep 0
        }

        // Fill with random obstacles based on stage using 2x2 logic
        for (let r = 2; r < ROWS - 2; r += 2) {     // Leave top 2 rows and bottom clear for spawns
            for (let c = 2; c < COLS - 2; c += 2) {
                // Keep center column somewhat clear for flow
                if (c >= 10 && c <= 15 && r >= 20) continue;

                // Keep enemy spawn blocks clear
                if (r < 4 && (c < 4 || c > COLS - 5 || (c > 10 && c < 16))) continue;

                if (Math.random() < 0.3) {
                    let type = 1;
                    // Start rendering Bush at Stage 2+, River at Stage 3+
                    if (stage >= 3 && Math.random() < 0.15) {
                        type = 4; // River
                    } else if (stage >= 2 && Math.random() < 0.2) {
                        type = 3; // Bush
                    } else if (Math.random() < 0.1 + (stage * 0.02)) {
                        type = 2; // Steel
                    }

                    // Assign 2x2 block
                    this.grid[r][c] = type;
                    this.grid[r + 1][c] = type;
                    this.grid[r][c + 1] = type;
                    this.grid[r + 1][c + 1] = type;
                }
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D, layer: 'ground' | 'bush' = 'ground') {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const type = this.grid[r][c];

                if (type === 1 && layer === 'ground') {
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

                } else if (type === 2 && layer === 'ground') {
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

                    // Internal bevel
                    ctx.strokeStyle = '#8d918d'; // Highlight
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 2, y + TILE_SIZE - 2);
                    ctx.lineTo(x + 2, y + 2);
                    ctx.lineTo(x + TILE_SIZE - 2, y + 2);
                    ctx.stroke();

                    ctx.strokeStyle = '#4b4d4b'; // Shadow
                    ctx.beginPath();
                    ctx.moveTo(x + TILE_SIZE - 2, y + 2);
                    ctx.lineTo(x + TILE_SIZE - 2, y + TILE_SIZE - 2);
                    ctx.lineTo(x + 2, y + TILE_SIZE - 2);
                    ctx.stroke();

                    // Rebar details (exposed wire)
                    ctx.strokeStyle = '#a65427'; // rusted rebar
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + TILE_SIZE / 4, y + TILE_SIZE / 4);
                    ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
                    ctx.moveTo(x + (TILE_SIZE / 4) * 3, y + TILE_SIZE / 4);
                    ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
                    ctx.stroke();

                } else if (type === 3 && layer === 'bush') {
                    // --- Bush ---
                    ctx.fillStyle = '#1e401e'; // Dark green
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#2d5e2d'; // Leaf highlights
                    ctx.beginPath();
                    ctx.arc(x + 5, y + 5, 4, 0, Math.PI * 2);
                    ctx.arc(x + 15, y + 10, 6, 0, Math.PI * 2);
                    ctx.arc(x + 8, y + 18, 5, 0, Math.PI * 2);
                    ctx.arc(x + 20, y + 20, 4, 0, Math.PI * 2);
                    ctx.fill();

                } else if (type === 4 && layer === 'ground') {
                    // --- River ---
                    ctx.fillStyle = '#2980b9'; // Base blue
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#3498db'; // Wave lines
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x + 4, y + 8);
                    ctx.lineTo(x + 12, y + 8);
                    ctx.moveTo(x + 14, y + 16);
                    ctx.lineTo(x + 22, y + 16);
                    ctx.stroke();
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

    public collides(x: number, y: number, w: number, h: number, isBullet: boolean = false): boolean {
        // Bounds
        if (x < 0 || y < 0 || x + w > COLS * TILE_SIZE || y + h > ROWS * TILE_SIZE) return true;

        const c1 = Math.floor(x / TILE_SIZE);
        const r1 = Math.floor(y / TILE_SIZE);
        const c2 = Math.floor((x + w - 0.1) / TILE_SIZE); // -0.1 to avoid edge case
        const r2 = Math.floor((y + h - 0.1) / TILE_SIZE);

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    const type = this.grid[r][c];
                    // 1: brick, 2: steel
                    if (type === 1 || type === 2) return true;
                    // 4: river blocks movements (tanks), but not bullets
                    if (!isBullet && type === 4) return true;
                } else {
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
                        AudioEngine.playHitBrick();
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
                        AudioEngine.playHitSteel();
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
            AudioEngine.playBaseDestroyed();
            this.game.gameOver();
            hit = true;
        }

        return hit;
    }
}
