import { Input } from './Input';
import { Map, TILE_SIZE, COLS, ROWS } from '../entities/Map';
import { Player } from '../entities/Player';
import { Entity } from '../entities/Entity';
import { Enemy } from '../entities/Enemy';
import { Tank } from '../entities/Tank';
import { PowerUp } from '../entities/PowerUp';

export class Game {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    public input: Input;
    public map: Map;
    public entities: Entity[] = [];
    public player!: Player;
    public score: number = 0;
    public enemiesRemaining: number = 20;
    public frozenTimer: number = 0;
    public shovelTimer: number = 0;

    public readonly gameWidth = COLS * TILE_SIZE;
    public readonly gameHeight = ROWS * TILE_SIZE;
    public readonly offsetX: number;
    public readonly offsetY: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.input = new Input();
        this.map = new Map(this);

        // Center 650x650 game inside 1280x700 canvas
        this.offsetX = Math.floor((1280 - this.gameWidth) / 2); // (1280 - 650) / 2 = 315
        this.offsetY = Math.floor((700 - this.gameHeight) / 2); // (700 - 650) / 2 = 25
    }

    public start() {
        this.reset();
        this.isRunning = true;
        this.input.init();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    public stop() {
        this.isRunning = false;
        this.input.destroy();
    }

    private reset() {
        this.entities = [];
        this.score = 0;
        this.enemiesRemaining = 20;
        this.frozenTimer = 0;
        this.shovelTimer = 0;
        this.map.loadLevel();
        this.player = new Player(this, 50 * 4, 50 * 12);
        this.addEntity(this.player);

        // Spawn initial enemies (every 4th is a power-up carrier)
        this.spawnEnemy(0, 0, false);
        this.spawnEnemy(6 * 50, 0, true); // 2nd enemy has power-up
        this.spawnEnemy(12 * 50, 0, false);
    }

    public spawnEnemy(x: number, y: number, hasPowerUp: boolean = false) {
        this.addEntity(new Enemy(this, x, y, hasPowerUp));
    }

    public addEntity(e: Entity) {
        this.entities.push(e);
    }

    public removeEntity(e: Entity) {
        const idx = this.entities.indexOf(e);
        if (idx > -1) {
            this.entities.splice(idx, 1);
        }
    }

    /** Upgrade base surrounding walls to steel (type 2) or back to brick (type 1) */
    public upgradeBaseWalls(toSteel: boolean) {
        const type = toSteel ? 2 : 1;
        // U-shape around base: rows 22-25, cols 11 and 14; rows 22-23, cols 12-13
        for (let r = 22; r <= 25; r++) {
            if (r < ROWS && 11 < COLS) this.map.grid[r][11] = type;
            if (r < ROWS && 14 < COLS) this.map.grid[r][14] = type;
        }
        for (let c = 11; c <= 14; c++) {
            if (22 < ROWS && c < COLS) this.map.grid[22][c] = type;
        }
    }

    private loop(timestamp: number) {
        if (!this.isRunning) return;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    private update(dt: number) {
        const delta = Math.min(dt, 50);

        // Shovel timer (base wall upgrade)
        if (this.shovelTimer > 0) {
            this.shovelTimer -= delta;
            if (this.shovelTimer <= 0) {
                this.upgradeBaseWalls(false); // revert to brick
            }
        }

        // Frozen timer
        if (this.frozenTimer > 0) {
            this.frozenTimer -= delta;
        }

        // Check power-up collisions
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            if (e instanceof PowerUp && this.player && e.collidesWith(this.player)) {
                this.applyPowerUp(e.type, this.player);
                this.removeEntity(e);
                continue;
            }
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            // Skip enemy updates when frozen
            if (this.frozenTimer > 0 && e instanceof Enemy) {
                continue;
            }
            e.update(delta);
        }
    }

    private applyPowerUp(type: string, player: Player) {
        switch (type) {
            case 'star':
                player.canDestroySteel = true;
                player.powerUpTimers.star = 15000;
                break;
            case 'shield':
                player.isInvincible = true;
                player.powerUpTimers.shield = 5000;
                break;
            case 'timer':
                this.frozenTimer = 5000;
                break;
            case 'grenade':
                const enemies = this.entities.filter(e => e instanceof Tank && (e as Tank).isEnemy);
                enemies.forEach(e => (e as Tank).destroy());
                break;
            case 'shovel':
                this.upgradeBaseWalls(true);
                this.shovelTimer = 10000;
                break;
            case 'life':
                player.lives++;
                break;
        }
    }

    private draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // 1. Full Canvas Background
        ctx.fillStyle = '#1a1916';
        ctx.fillRect(0, 0, W, H);

        // Side panels
        const panelGrad = ctx.createLinearGradient(0, 0, 0, H);
        panelGrad.addColorStop(0, '#222019');
        panelGrad.addColorStop(0.5, '#1c1a17');
        panelGrad.addColorStop(1, '#18160f');
        ctx.fillStyle = panelGrad;

        // Left Panel
        ctx.fillRect(0, 0, this.offsetX - 4, H);
        // Right Panel
        ctx.fillRect(this.offsetX + this.gameWidth + 4, 0, W - this.offsetX - this.gameWidth - 4, H);

        // Frame border around game area
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.offsetX - 4, this.offsetY - 4, this.gameWidth + 8, this.gameHeight + 8);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, this.gameWidth + 4, this.gameHeight + 4);

        // 2. Game World
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);
        ctx.clip();
        ctx.translate(this.offsetX, this.offsetY);

        ctx.fillStyle = '#0f0e0d';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        this.map.draw(ctx);

        this.entities.sort((a, b) => a.zIndex - b.zIndex);
        this.entities.forEach(e => e.draw(ctx));

        ctx.restore();

        // 3. HUD (Side Panels)
        this.drawHUD(ctx);
    }

    private drawHUD(ctx: CanvasRenderingContext2D) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const rightPanelX = this.offsetX + this.gameWidth + 4;
        const leftPanelWidth = this.offsetX - 4;
        const rightPanelWidth = W - rightPanelX;

        // Rivet dots on left panel borders
        ctx.fillStyle = '#2a2820';
        for (let ry = 40; ry < H; ry += 120) {
            ctx.beginPath(); ctx.arc(20, ry, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(leftPanelWidth - 20, ry, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(rightPanelX + 20, ry, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(W - 20, ry, 3, 0, Math.PI * 2); ctx.fill();
        }

        // --- LEFT PANEL ---
        const leftCenterX = leftPanelWidth / 2;

        // Stage Info
        ctx.font = 'bold 22px "Share Tech Mono", monospace';
        ctx.fillStyle = '#8a7e6a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STAGE', leftCenterX, 80);

        ctx.font = 'bold 48px "Black Ops One", monospace';
        ctx.fillStyle = '#e0dcd3';
        ctx.fillText('1', leftCenterX, 130);

        // Score
        ctx.font = 'bold 20px "Share Tech Mono", monospace';
        ctx.fillStyle = '#8a7e6a';
        ctx.fillText('SCORE', leftCenterX, 220);
        ctx.font = 'bold 36px "Share Tech Mono", monospace';
        ctx.fillStyle = '#e0dcd3';
        ctx.fillText(this.score.toString().padStart(5, '0'), leftCenterX, 260);

        // Hi-Score
        ctx.font = 'bold 16px "Share Tech Mono", monospace';
        ctx.fillStyle = '#8a7e6a';
        ctx.fillText('HI-SCORE', leftCenterX, 330);
        ctx.font = 'bold 24px "Share Tech Mono", monospace';
        ctx.fillStyle = '#d3a339';
        ctx.fillText('25000', leftCenterX, 360);

        // Active Power-Up indicators
        if (this.player && (this.player.canDestroySteel || this.frozenTimer > 0)) {
            ctx.font = '14px "Share Tech Mono", monospace';
            ctx.fillStyle = '#8a7e6a';
            ctx.fillText('STATUS', leftCenterX, 450);

            let statusY = 480;
            if (this.player.canDestroySteel) {
                ctx.fillStyle = '#d3a339';
                ctx.fillText('★ ARMOR PIERCING', leftCenterX, statusY);
                statusY += 30;
            }
            if (this.frozenTimer > 0) {
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText('⏱ TIME FROZEN', leftCenterX, statusY);
            }
        }

        // --- RIGHT PANEL ---
        const rightCenterX = rightPanelX + rightPanelWidth / 2;

        // Enemy Count
        ctx.font = 'bold 22px "Share Tech Mono", monospace';
        ctx.fillStyle = '#c0392b';
        ctx.fillText('ENEMY', rightCenterX, 80);
        ctx.fillText('COUNT', rightCenterX, 105);
        ctx.font = 'bold 48px "Black Ops One", monospace';
        ctx.fillText(this.enemiesRemaining.toString(), rightCenterX, 160);

        // Draw enemy mini icons
        ctx.fillStyle = '#5a6255';
        let enemyStartY = 200;
        let enemyStartX = rightCenterX - 45;
        for (let i = 0; i < this.enemiesRemaining && i < 20; i++) {
            const r = Math.floor(i / 5);
            const c = i % 5;
            ctx.fillRect(enemyStartX + c * 20, enemyStartY + r * 20, 14, 14);
        }

        // Lives
        const livesY = 380;
        ctx.font = 'bold 22px "Share Tech Mono", monospace';
        ctx.fillStyle = '#8a7e6a';
        ctx.fillText('LIVES', rightCenterX, livesY);

        ctx.font = 'bold 36px "Share Tech Mono", monospace';
        ctx.fillStyle = '#c0392b';
        const lives = this.player ? this.player.lives : 3;
        let heartsStr = '';
        for (let i = 0; i < lives; i++) heartsStr += '♥ ';
        ctx.fillText(heartsStr.trim() || 'DEAD', rightCenterX, livesY + 40);

        // Base icon
        ctx.fillStyle = '#d3a339';
        ctx.beginPath();
        const basex = rightCenterX;
        const basey = 520;
        ctx.arc(basex, basey, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1c1a17';
        ctx.beginPath();
        ctx.arc(basex, basey, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    public updateHUD() {
        // HUD is drawn on canvas each frame
    }

    public gameOver() {
        this.stop();
        const overMenu = document.getElementById('game-over');
        if (overMenu) {
            overMenu.classList.remove('hidden');
        }
    }
}
