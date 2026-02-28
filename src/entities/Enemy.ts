import { Game } from '../core/Game';
import { Tank, type Direction } from './Tank';
import { PowerUp, type PowerUpType } from './PowerUp';

export class Enemy extends Tank {
    private directionTimer: number = 0;
    public hasPowerUp: boolean = false;
    private flashTimer: number = 0;

    constructor(game: Game, x: number, y: number, hasPowerUp: boolean = false) {
        super(game, x, y);
        this.isEnemy = true;
        this.speed = 80;
        this.fireRate = 1500;
        this.hasPowerUp = hasPowerUp;
        this.pickRandomDirection();
    }

    public update(dt: number) {
        super.update(dt);

        // Flash timer for power-up carriers
        if (this.hasPowerUp) {
            this.flashTimer += dt;
        }

        this.directionTimer -= dt;
        if (this.directionTimer <= 0) {
            this.pickRandomDirection();
        }

        const oldX = this.x;
        const oldY = this.y;
        this.move(this.dir, dt);

        if (this.x === oldX && this.y === oldY) {
            this.directionTimer -= dt * 5;
        }

        if (Math.random() < 0.02) {
            this.fire();
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (this.hasPowerUp) {
            const glow = Math.abs(Math.sin(this.flashTimer / 200));

            // Draw the tank with a heavy red glow
            ctx.save();
            ctx.shadowBlur = 15 + glow * 15;
            ctx.shadowColor = `rgba(255, 50, 50, ${0.6 + glow * 0.4})`;
            super.draw(ctx);
            ctx.restore();

            // Draw a spinning tech ring around the carrier
            ctx.save();
            ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + glow * 0.6})`;
            ctx.lineWidth = 2;
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.flashTimer / 400);

            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 6, 0, Math.PI * 2);
            ctx.setLineDash([10, 5, 2, 5]);
            ctx.stroke();
            ctx.restore();
        } else {
            super.draw(ctx);
        }
    }

    private pickRandomDirection() {
        const dirs: Direction[] = ['up', 'down', 'left', 'right'];
        if (Math.random() < 0.4) {
            this.dir = 'down';
        } else {
            this.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
        this.directionTimer = 1000 + Math.random() * 2000;
    }

    public destroy() {
        // Drop power-up if this enemy is a carrier
        if (this.hasPowerUp) {
            const types: PowerUpType[] = ['star', 'shield', 'timer', 'grenade', 'shovel', 'life', 'grapefruit'];
            const type = types[Math.floor(Math.random() * types.length)];
            // Place on a random open area
            const px = Math.random() * (this.game.map.grid[0].length * 25 - 60) + 30;
            const py = Math.random() * (this.game.map.grid.length * 25 - 60) + 60;
            this.game.addEntity(new PowerUp(this.game, px, py, type));
        }

        super.destroy();

        // Decrement enemy counter
        this.game.enemiesRemaining = Math.max(0, this.game.enemiesRemaining - 1);

        // Respawn a new enemy
        setTimeout(() => {
            if (this.game && (this.game as any)['isRunning']) {
                const spawnPoints = [{ x: 0, y: 0 }, { x: 6 * 50, y: 0 }, { x: 12 * 50, y: 0 }];
                const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                // Every 4th enemy is a power-up carrier
                const hasPU = this.game.enemiesRemaining > 0 && this.game.enemiesRemaining % 4 === 0;
                this.game.spawnEnemy(pt.x, pt.y, hasPU);
            }
        }, 3000);
    }
}
