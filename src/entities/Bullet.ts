import { Game } from '../core/Game';
import { Entity } from './Entity';
import { Tank } from './Tank';
import { Particle } from './Particle';

export class Bullet extends Entity {
    public dx: number = 0;
    public dy: number = 0;
    public speed: number = 450;
    public owner: Tank;
    public active: boolean = true;

    constructor(game: Game, x: number, y: number, dir: 'up' | 'down' | 'left' | 'right', owner: Tank) {
        super(game, x, y, 6, 6);
        this.owner = owner;
        this.zIndex = 10;

        if (dir === 'up') this.dy = -this.speed;
        if (dir === 'down') this.dy = this.speed;
        if (dir === 'left') this.dx = -this.speed;
        if (dir === 'right') this.dx = this.speed;
    }

    public update(dt: number) {
        if (!this.active) return;

        this.x += this.dx * (dt / 1000);
        this.y += this.dy * (dt / 1000);

        // Map collision
        if (this.game.map.destroyTile(this.x, this.y, this.width, this.height, this.owner.canDestroySteel)) {
            this.destroy(); // Bullet dies when it hits map
            return;
        }
        // Map bounds checking
        if (this.game.map.collides(this.x, this.y, this.width, this.height)) {
            this.destroy();
            return;
        }

        // Entity collision
        for (const e of this.game.entities) {
            if (e !== this && e !== this.owner && this.collidesWith(e)) {
                if (e instanceof Tank) {
                    if (this.owner.isEnemy !== e.isEnemy) {
                        if (e.isInvincible) {
                            // Invincible player: bullet destroyed, player unharmed
                            this.destroy();
                        } else {
                            e.destroy();
                            this.destroy();
                            if (e.isEnemy && !this.owner.isEnemy) {
                                this.game.score += 100;
                                this.game.updateHUD();
                            }
                        }
                    } else {
                        this.destroy();
                    }
                }
                if (e instanceof Bullet) {
                    e.destroy();
                    this.destroy();
                }
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.dx > 0) ctx.rotate(Math.PI / 2); // right
        else if (this.dy > 0) ctx.rotate(Math.PI); // down
        else if (this.dx < 0) ctx.rotate(-Math.PI / 2); // left

        // Base styles
        let shellColor = '#bfa175';
        let tipColor = '#cfb53b';
        let tailColor = 'rgba(255, 200, 50, 0.6)';
        let tailLength = this.height * 2;

        if (this.owner.isEnemy) {
            shellColor = '#4a5d4e'; // dark green casing
            tipColor = '#39ff14';   // neon green tip
            tailColor = 'rgba(57, 255, 20, 0.6)';
        } else if (this.owner.canDestroySteel) {
            shellColor = '#5d4a4a'; // dark red casing
            tipColor = '#ff2a2a';   // scorching red tip
            tailColor = 'rgba(255, 42, 42, 0.8)';
            tailLength = this.height * 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = tipColor;
        } else {
            shellColor = '#bfa175'; // standard brass
            tipColor = '#55ddff';   // plasma blue tip
            tailColor = 'rgba(85, 221, 255, 0.6)';
        }

        // Plasma tail
        ctx.fillStyle = tailColor;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 1, this.height / 2 - 2);
        ctx.lineTo(this.width / 2 - 1, this.height / 2 - 2);
        ctx.lineTo(0, this.height / 2 + tailLength);
        ctx.fill();

        // Physical shell casing
        ctx.fillStyle = shellColor;
        if (!this.owner.canDestroySteel) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
        }
        ctx.fillRect(-this.width / 2, -this.height / 2 + 2, this.width, this.height - 2);

        // Bullet Tip
        ctx.fillStyle = tipColor;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -this.height / 2 + 2);
        ctx.lineTo(-this.width / 2, -this.height / 2 + 2);
        ctx.lineTo(0, -this.height / 2 - 4);
        ctx.fill();

        // Dark tail band
        ctx.fillStyle = '#222';
        ctx.fillRect(-this.width / 2, this.height / 2 - 2, this.width, 2);

        ctx.restore();
    }

    public destroy() {
        this.active = false;
        this.game.removeEntity(this);
        for (let i = 0; i < 6; i++) {
            const color = this.owner.isEnemy ? '#39ff14' : (this.owner.canDestroySteel ? '#ff2a2a' : '#55ddff');
            this.game.addEntity(new Particle(this.game, this.x, this.y, color, 1.2, 0.6, 'spark'));
        }
    }
}
