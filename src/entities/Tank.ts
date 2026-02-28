import { Game } from '../core/Game';
import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { AudioEngine } from '../core/Audio';

export type Direction = 'up' | 'down' | 'left' | 'right';

export abstract class Tank extends Entity {
    public speed: number = 150;
    public dir: Direction = 'up';
    public isEnemy: boolean = false;
    public cooldown: number = 0;
    public fireRate: number = 500;
    public canDestroySteel: boolean = false;
    public isInvincible: boolean = false;
    public powerUpTimers: { star: number; shield: number } = { star: 0, shield: 0 };

    constructor(game: Game, x: number, y: number) {
        super(game, x, y, 50, 50);
        this.zIndex = 5;
    }

    public update(dt: number) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }
        // Power-up timers
        if (this.powerUpTimers.star > 0) {
            this.powerUpTimers.star -= dt;
            if (this.powerUpTimers.star <= 0) this.canDestroySteel = false;
        }
        if (this.powerUpTimers.shield > 0) {
            this.powerUpTimers.shield -= dt;
            if (this.powerUpTimers.shield <= 0) this.isInvincible = false;
        }
    }

    public move(dir: Direction, dt: number) {
        this.dir = dir;
        let newX = this.x;
        let newY = this.y;

        const snap = 5;

        if (dir === 'up') {
            newY -= this.speed * (dt / 1000);
            newX = Math.round(newX / snap) * snap;
        } else if (dir === 'down') {
            newY += this.speed * (dt / 1000);
            newX = Math.round(newX / snap) * snap;
        } else if (dir === 'left') {
            newX -= this.speed * (dt / 1000);
            newY = Math.round(newY / snap) * snap;
        } else if (dir === 'right') {
            newX += this.speed * (dt / 1000);
            newY = Math.round(newY / snap) * snap;
        }

        if (!this.game.map.collides(newX, newY, this.width, this.height)) {
            let canMove = true;
            const dummy = new (class extends Entity {
                update() { }
                draw() { }
            })(this.game, newX, newY, this.width, this.height);

            for (const e of this.game.entities) {
                if (e !== this && e instanceof Tank && dummy.collidesWith(e)) {
                    // Let players and allies pass through each other to prevent getting stuck
                    if (this.isEnemy === false && e.isEnemy === false) continue;
                    canMove = false;
                    break;
                }
            }

            if (canMove) {
                this.x = newX;
                this.y = newY;
            }
        }
    }

    public fire() {
        if (this.cooldown <= 0) {
            this.cooldown = this.fireRate;
            AudioEngine.playShoot();
            let bx = this.x;
            let by = this.y;
            const bSize = 6;

            if (this.dir === 'up') {
                bx += (this.width - bSize) / 2;
                by -= bSize;
            } else if (this.dir === 'down') {
                bx += (this.width - bSize) / 2;
                by += this.height;
            } else if (this.dir === 'left') {
                bx -= bSize;
                by += (this.height - bSize) / 2;
            } else if (this.dir === 'right') {
                bx += this.width;
                by += (this.height - bSize) / 2;
            }

            this.game.addEntity(new Bullet(this.game, bx, by, this.dir, this));
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        // Player 1 (Yellow) vs Enemy (Green/Grey)
        const primaryColor = this.isEnemy ? (this.width > 30 ? '#5a6255' : '#4a5b42') : '#d3a339';
        const darkColor = this.isEnemy ? '#3a4235' : '#8b6914';
        const shadowColor = 'rgba(0,0,0,0.5)';

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.dir === 'right') ctx.rotate(Math.PI / 2);
        else if (this.dir === 'down') ctx.rotate(Math.PI);
        else if (this.dir === 'left') ctx.rotate(-Math.PI / 2);

        // Shrink visual size to 80% to fit better inside the 50x50 hit box
        ctx.scale(0.8, 0.8);

        // --- Drop Shadow ---
        ctx.shadowBlur = 10;
        ctx.shadowColor = shadowColor;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        // --- Tracks (Left and Right) ---
        ctx.fillStyle = '#1c1b18';
        // Left track
        ctx.fillRect(-this.width / 2, -this.height / 2 + 2, 8, this.height - 4);
        // Right track
        ctx.fillRect(this.width / 2 - 8, -this.height / 2 + 2, 8, this.height - 4);
        ctx.shadowBlur = 0; // Turn off shadow for inner details
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Track treads (Pseudo-3D ridges)
        const offset = ((this.x + this.y) % 10) / 2;
        for (let i = 0; i < this.height - 4; i += 4) {
            const treadY = -this.height / 2 + 2 + ((i + offset) % (this.height - 4));

            // Tread highlight
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(-this.width / 2, treadY, 8, 1.5);
            ctx.fillRect(this.width / 2 - 8, treadY, 8, 1.5);

            // Tread shadow
            ctx.fillStyle = '#050505';
            ctx.fillRect(-this.width / 2, treadY + 1.5, 8, 2.5);
            ctx.fillRect(this.width / 2 - 8, treadY + 1.5, 8, 2.5);
        }

        // --- Main Chassis ---
        const grad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, darkColor);

        ctx.fillStyle = grad;
        // Chipped paint & rust edges
        ctx.strokeStyle = '#2d281e';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 6, -this.height / 2 + 6);
        ctx.lineTo(this.width / 2 - 6, -this.height / 2 + 6);
        ctx.lineTo(this.width / 2 - 4, this.height / 2 - 4);
        ctx.lineTo(-this.width / 2 + 4, this.height / 2 - 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner bevel highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 7, this.height / 2 - 5);
        ctx.lineTo(-this.width / 2 + 7, -this.height / 2 + 7);
        ctx.lineTo(this.width / 2 - 7, -this.height / 2 + 7);
        ctx.stroke();

        // Inner bevel shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 7, -this.height / 2 + 7);
        ctx.lineTo(this.width / 2 - 5, this.height / 2 - 5);
        ctx.lineTo(-this.width / 2 + 7, this.height / 2 - 5);
        ctx.stroke();

        // Weathering / Rust spots
        ctx.fillStyle = 'rgba(60, 30, 8, 0.4)';
        ctx.fillRect(-this.width / 2 + 8, -this.height / 2 + 8, 6, 4);
        ctx.fillRect(this.width / 2 - 10, this.height / 2 - 12, 4, 6);

        // --- Turret ---
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowOffsetY = 3;

        const turretRadius = this.width / 3.5;
        const turretGrad = ctx.createRadialGradient(-turretRadius / 3, -turretRadius / 3, 2, 0, 0, turretRadius);
        turretGrad.addColorStop(0, '#ffffff'); // Specular highlight
        turretGrad.addColorStop(0.2, primaryColor);
        turretGrad.addColorStop(1, darkColor);

        ctx.fillStyle = turretGrad;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.stroke(); // turret outline

        // Commander Hatch
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        // --- Gun Barrel ---
        const gunGrad = ctx.createLinearGradient(-2, 0, 2, 0); // Sideways gradient for cylinder effect
        gunGrad.addColorStop(0, '#222');
        gunGrad.addColorStop(0.5, '#888'); // Top reflection
        gunGrad.addColorStop(1, '#111');
        ctx.fillStyle = gunGrad;

        // Barrel base
        ctx.fillRect(-2, -this.height / 2 - 4, 4, 10);
        // Barrel extension
        ctx.fillRect(-1, -this.height / 2 - 8, 2, 8);

        ctx.restore();

        // Shield effect when invincible
        if (this.isInvincible) {
            ctx.save();
            ctx.strokeStyle = 'rgba(74,158,255,0.7)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#4a9eff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    public destroy() {
        AudioEngine.playExplosion();
        this.game.removeEntity(this);
        for (let i = 0; i < 20; i++) {
            // fiery orange to smoke circles
            const colors = ['#ff4500', '#ffa500', '#ff8c00'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, color, 1.5, 2, 'circle'));
        }
        for (let i = 0; i < 15; i++) {
            // thick smoke
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#444', 1, 2, 'smoke'));
        }
        for (let i = 0; i < 10; i++) {
            // metal debris
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#222', 1.5, 1.5, 'rect'));
        }
    }
}
