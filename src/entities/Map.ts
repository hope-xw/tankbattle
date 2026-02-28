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

        // Generate base protection (1 block thick)
        for (let r = 23; r <= 25; r++) {
            this.grid[r][11] = 1; // Left wall (col 11)
            this.grid[r][14] = 1; // Right wall (col 14)
        }
        for (let c = 12; c <= 13; c++) {
            this.grid[23][c] = 1; // Top wall (row 23)
        }

        // Generate random map clusters based on stage
        const numClusters = 40 + stage * 5;
        for (let i = 0; i < numClusters; i++) {
            let r = 2 + Math.floor(Math.random() * (ROWS - 6));
            let c = 2 + Math.floor(Math.random() * (COLS - 6));

            // 40% horizontal, 40% vertical, 20% 2x2 block
            let shape = Math.random();
            let len = 2 + Math.floor(Math.random() * 4); // 2 to 5 tiles long
            if (shape >= 0.8) len = 4; // fixed 4 for the 2x2 box shape

            let type = 1;
            // Start rendering Bush at Stage 2+, River at Stage 3+
            if (stage >= 3 && Math.random() < 0.15) {
                type = 4; // River
            } else if (stage >= 2 && Math.random() < 0.2) {
                type = 3; // Bush
            } else if (Math.random() < 0.1 + (stage * 0.02)) {
                type = 2; // Steel
            }

            for (let j = 0; j < len; j++) {
                let currR = r;
                let currC = c;

                if (shape < 0.4) {
                    currC += j; // Horizontal line
                } else if (shape < 0.8) {
                    currR += j; // Vertical line
                } else {
                    currC += (j % 2); // 2x2 box
                    currR += Math.floor(j / 2);
                }

                // Protect paths (keep center and spawn clear)
                if (currC >= 10 && currC <= 15 && currR >= 20) continue;
                if (currR < 4 && (currC < 4 || currC > COLS - 5 || (currC > 10 && currC < 16))) continue;

                this.grid[currR][currC] = type;
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D, layer: 'ground' | 'bush' = 'ground') {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const type = this.grid[r][c];

                if (type === 0) continue;

                ctx.save();

                if (type === 1 && layer === 'ground') {
                    // --- 3D Brick Wall Segment ---
                    ctx.fillStyle = '#6b320d'; // Darker mortar base
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    const brickH = TILE_SIZE / 4;
                    const brickW = TILE_SIZE / 2;

                    for (let row = 0; row < 4; row++) {
                        const rowY = y + row * brickH;
                        const offset = (row % 2 === 0) ? 0 : -brickW / 2;

                        for (let col = 0; col < 3; col++) {
                            const bx = x + offset + col * brickW;
                            if (bx > x + TILE_SIZE - 1 || bx + brickW < x) continue; // Skip out of bounds

                            // Clip the brick to the tile boundary
                            const drawX = Math.max(x, bx);
                            const drawW = Math.min(x + TILE_SIZE - drawX, brickW - (drawX - bx));

                            // Brick base color
                            ctx.fillStyle = '#8b4513';
                            ctx.fillRect(drawX, rowY, drawW, brickH - 1);

                            // Brick highlight (Top and Left)
                            ctx.fillStyle = 'rgba(255, 170, 100, 0.3)';
                            ctx.fillRect(drawX, rowY, drawW, 1);
                            ctx.fillRect(drawX, rowY, 1, brickH - 1);

                            // Brick shadow (Bottom and Right)
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                            ctx.fillRect(drawX, rowY + brickH - 2, drawW, 1);
                            ctx.fillRect(drawX + drawW - 1, rowY, 1, brickH - 1);
                        }
                    }

                } else if (type === 2 && layer === 'ground') {
                    // --- 3D Steel Barrier ---
                    // Diagonal metallic gradient
                    const grad = ctx.createLinearGradient(x, y, x + TILE_SIZE, y + TILE_SIZE);
                    grad.addColorStop(0, '#a0a5a0');
                    grad.addColorStop(0.3, '#ffffff'); // bright shine
                    grad.addColorStop(0.5, '#7a7e7a');
                    grad.addColorStop(0.8, '#525552');
                    grad.addColorStop(1, '#2a2c2a');

                    ctx.fillStyle = grad;
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    // Outer Bevel Highlight (Top & Left)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillRect(x, y, TILE_SIZE, 2);
                    ctx.fillRect(x, y, 2, TILE_SIZE);

                    // Outer Bevel Shadow (Bottom & Right)
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
                    ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);

                    // Inner recessed area
                    ctx.fillStyle = '#4a4d4a';
                    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

                    // Inner bevel Shadow (Top & Left)
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, 1);
                    ctx.fillRect(x + 5, y + 5, 1, TILE_SIZE - 10);

                    // Inner bevel Highlight (Bottom & Right)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(x + 5, y + TILE_SIZE - 6, TILE_SIZE - 10, 1);
                    ctx.fillRect(x + TILE_SIZE - 6, y + 5, 1, TILE_SIZE - 10);

                    // Rivets in the 4 corners
                    ctx.fillStyle = '#222';
                    const rivetPos = [
                        [x + 3, y + 3], [x + TILE_SIZE - 3, y + 3],
                        [x + 3, y + TILE_SIZE - 3], [x + TILE_SIZE - 3, y + TILE_SIZE - 3]
                    ];
                    rivetPos.forEach(([rx, ry]) => {
                        ctx.beginPath();
                        ctx.arc(rx, ry, 1, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.fillRect(rx, ry + 1, 1, 1); // small rivet highlight
                        ctx.fillStyle = '#222';
                    });

                } else if (type === 3 && layer === 'bush') {
                    // --- 3D Bush ---
                    // Draw overlapping shaded circles instead of flat ones
                    const drawLeaf = (lx: number, ly: number, r: number) => {
                        const lg = ctx.createRadialGradient(lx - r / 3, ly - r / 3, 1, lx, ly, r);
                        lg.addColorStop(0, '#4cd137');
                        lg.addColorStop(0.5, '#2d5e2d');
                        lg.addColorStop(1, '#0c240c');

                        ctx.shadowBlur = 4;
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowOffsetY = 2;

                        ctx.fillStyle = lg;
                        ctx.beginPath();
                        ctx.arc(lx, ly, r, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.shadowBlur = 0;
                        ctx.shadowOffsetY = 0;
                    };

                    drawLeaf(x + 6, y + 6, 6);
                    drawLeaf(x + 19, y + 8, 7);
                    drawLeaf(x + 9, y + 19, 8);
                    drawLeaf(x + 20, y + 20, 6);
                    drawLeaf(x + 12, y + 12, 9); // center covering

                } else if (type === 4 && layer === 'ground') {
                    // --- 3D River ---
                    const rw = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
                    rw.addColorStop(0, '#1a5276');
                    rw.addColorStop(0.5, '#2980b9');
                    rw.addColorStop(1, '#154360');
                    ctx.fillStyle = rw;
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                    // Wave sparkles
                    const timeOffset = Date.now() / 300 % 10;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + 2 + (timeOffset % 4), y + 6);
                    ctx.lineTo(x + 10 + (timeOffset % 4), y + 6);

                    ctx.moveTo(x + 14 - (timeOffset % 4), y + 14);
                    ctx.lineTo(x + 22 - (timeOffset % 4), y + 14);

                    ctx.moveTo(x + 8 + (timeOffset % 5), y + 20);
                    ctx.lineTo(x + 16 + (timeOffset % 5), y + 20);
                    ctx.stroke();

                    // Water depth shadow on edges
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(x, y, TILE_SIZE, 2);
                    ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
                }

                ctx.restore();
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

            // Metallic gradient for the eagle
            const eagleGrad = ctx.createLinearGradient(cx - 16, cy - 16, cx + 16, cy + 16);
            eagleGrad.addColorStop(0, '#f9ca24'); // Bright gold
            eagleGrad.addColorStop(0.5, '#f1c40f');
            eagleGrad.addColorStop(1, '#b8860b'); // Dark gold

            ctx.fillStyle = eagleGrad;
            ctx.strokeStyle = '#8b6914';
            ctx.lineWidth = 1;

            // Halo glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(249, 202, 36, 0.6)';

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

            // Clear shadow settings
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
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
