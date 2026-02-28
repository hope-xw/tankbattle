import { Game } from '../core/Game';
import { Entity } from './Entity';

export type ParticleType = 'circle' | 'rect' | 'spark' | 'smoke';

export class Particle extends Entity {
    public vx: number;
    public vy: number;
    private life: number;
    private maxLife: number;
    private color: string;
    private size: number;
    private type: ParticleType;
    private rot: number = 0;
    private rotSpeed: number = 0;

    constructor(game: Game, x: number, y: number, color: string, speedMult: number = 1, sizeMult: number = 1, type: ParticleType = 'circle') {
        super(game, x, y, 0, 0);
        this.zIndex = 20;
        this.color = color;
        this.type = type;

        const angle = Math.random() * Math.PI * 2;
        let speed = (Math.random() * 100 + 50) * speedMult;

        if (type === 'smoke') {
            speed *= 0.4;
            this.maxLife = Math.random() * 0.8 + 0.4;
            this.size = (Math.random() * 8 + 4) * sizeMult;
        } else if (type === 'spark') {
            speed *= 2.0;
            this.maxLife = Math.random() * 0.3 + 0.1;
            this.size = (Math.random() * 2 + 1) * sizeMult;
        } else if (type === 'rect') {
            speed *= 0.8;
            this.maxLife = Math.random() * 0.5 + 0.2;
            this.size = (Math.random() * 4 + 2) * sizeMult;
            this.rotSpeed = (Math.random() - 0.5) * 20;
        } else {
            this.maxLife = Math.random() * 0.5 + 0.2;
            this.size = (Math.random() * 4 + 1) * sizeMult;
        }

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = this.maxLife;
    }

    public update(dt: number) {
        this.life -= dt / 1000;
        if (this.life <= 0) {
            this.game.removeEntity(this);
            return;
        }
        this.x += this.vx * (dt / 1000);
        this.y += this.vy * (dt / 1000);
        // drag
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.rot += this.rotSpeed * (dt / 1000);
    }

    public draw(ctx: CanvasRenderingContext2D) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.type === 'smoke') {
            ctx.beginPath();
            // expanding smoke
            ctx.arc(this.x, this.y, this.size + (this.maxLife - this.life) * 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'rect') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            // short trailing line pointing opposite to velocity
            ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
            ctx.stroke();
        } else {
            // standard circle fire
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
