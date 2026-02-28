import { Game } from '../core/Game';
import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { AudioEngine } from '../core/Audio';
import { SpriteManager } from '../core/SpriteManager';

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

    // Animation states
    public currentFrame: number = 0;
    public frameTimer: number = 0;
    public isFiring: boolean = false;
    private frameInterval: number = 400 / 8;

    public update(dt: number) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // Sprite animation update
        if (this.isFiring) {
            this.frameTimer += dt;
            if (this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.currentFrame++;
                if (this.currentFrame >= 8) {
                    this.isFiring = false;
                    this.currentFrame = 0;
                }
            }
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

            // Trigger animation
            this.isFiring = true;
            this.currentFrame = 1; // skip 0 (idle)
            this.frameTimer = 0;

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
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.dir === 'right') ctx.rotate(Math.PI / 2);
        else if (this.dir === 'down') ctx.rotate(Math.PI);
        else if (this.dir === 'left') ctx.rotate(-Math.PI / 2);

        // Render Sprite depending on type
        // Note: the original sprites were drawn facing up.
        // We crop the 1/8th frame. Each sprite sheet is 2048x2048, so one frame is 256x2048.
        let spriteKey = 'player_tank';
        if (this.isEnemy) {
            // In Enemy.ts, we could distinguish type, but for now fallback to green.
            // (We'll override this logic slightly in Enemy subclass if needed).
            spriteKey = (this as any).enemyType === 'fast' ? 'enemy_gray' : 'enemy_green';
        }

        // Ally uses player tank sprite but maybe with tint if wanted, for now just reuse player tank
        if ((this as any).isAlly) {
            spriteKey = 'player_tank';
        }

        const img = SpriteManager.getInstance().get(spriteKey);

        // Ensure image is loaded before drawing to avoid errors
        if (img && img.width > 0) {
            const frameW = img.width / 8;
            const frameH = img.height;

            // We scale the extremely vertical 256x2048 image down to fit roughly in the 50x50 block,
            // while preserving its aspect ratio. The image has a huge gun/smoke that extends way above,
            // so we center the base chassis in the 50x50 tile.
            // Visually in the asset, the chassis is at the bottom.
            const drawW = this.width * 1.5; // Slightly oversized for effect
            const drawH = drawW * (frameH / frameW);

            // Offset the drawing upwards because the bottom part contains the chassis
            const drawX = -drawW / 2;
            const drawY = -drawH + (this.height * 0.75);

            ctx.drawImage(img, this.currentFrame * frameW, 0, frameW, frameH, drawX, drawY, drawW, drawH);
        } else {
            // Fallback rectangle if image fails or isn't loaded yet
            ctx.fillStyle = this.isEnemy ? 'red' : 'yellow';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

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
