import { Game } from '../core/Game';
import { Entity } from './Entity';

export type PowerUpType = 'star' | 'shield' | 'timer' | 'grenade' | 'shovel' | 'life' | 'grapefruit';

const POWERUP_COLORS: Record<PowerUpType, string> = {
    star: '#d3a339',
    shield: '#4a9eff',
    timer: '#aaaaaa',
    grenade: '#c0392b',
    shovel: '#8b6914',
    life: '#e74c3c',
    grapefruit: '#FF5E7E', // vivid pink/grapefruit color
};

const POWERUP_LABELS: Record<PowerUpType, string> = {
    star: '★',
    shield: 'S',
    timer: 'T',
    grenade: 'B',
    shovel: 'W',
    life: '+',
    grapefruit: 'GF',
};

export class PowerUp extends Entity {
    public type: PowerUpType;
    private lifetime: number = 10000;
    private blinkTimer: number = 0;
    private visible: boolean = true;

    constructor(game: Game, x: number, y: number, type: PowerUpType) {
        super(game, x, y, 30, 30);
        this.type = type;
        this.zIndex = 8;
    }

    public update(dt: number) {
        this.lifetime -= dt;
        this.blinkTimer += dt;

        const blinkRate = this.lifetime < 3000 ? 100 : 250;
        this.visible = Math.floor(this.blinkTimer / blinkRate) % 2 === 0;

        if (this.lifetime <= 0) {
            this.game.removeEntity(this);
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (!this.visible) return;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const color = POWERUP_COLORS[this.type];

        ctx.save();

        // Background glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Rounded rect background
        ctx.fillStyle = 'rgba(20,18,15,0.85)';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Icon label
        ctx.font = 'bold 18px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(POWERUP_LABELS[this.type], cx, cy);

        ctx.restore();
    }
}
