import { Game } from '../core/Game';
import { Tank, type Direction } from './Tank';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { AudioEngine } from '../core/Audio';
import { Particle } from './Particle';

export class Ally extends Tank {
    private movementTimer: number = 0;
    private lifeTimer: number = 30000; // 30 seconds

    constructor(game: Game, x: number, y: number) {
        super(game, x, y);
        this.isEnemy = false;
        this.speed = 130;
        this.fireRate = 400; // Shoots fast
        this.canDestroySteel = true; // Bonus: allies fire piercing rounds
    }

    public update(dt: number) {
        super.update(dt);

        this.lifeTimer -= dt;
        if (this.lifeTimer <= 0) {
            // Expire and create a small pop
            for (let i = 0; i < 15; i++) {
                this.game.addEntity(new Particle(this.game, this.x + 20, this.y + 20, '#FF5E7E'));
            }
            this.game.removeEntity(this);
            return;
        }

        // AI Logic
        this.movementTimer -= dt;

        // Try to shoot towards enemies
        if (this.cooldown <= 0) {
            const hasEnemyInLineOfSight = this.checkLineOfSight();
            if (hasEnemyInLineOfSight || Math.random() < 0.05) {
                this.shoot();
            }
        }

        if (this.movementTimer <= 0) {
            this.pickNewDirection();
            this.movementTimer = 300 + Math.random() * 800; // change direction less often, track better
        }

        this.move(this.dir, dt);

        // Blinking effect when lifespan < 3s
        if (this.lifeTimer < 3000 && Math.floor(this.lifeTimer / 150) % 2 === 0) {
            // skip draw logic handled in draw if needed, or alpha fading
        }
    }

    private checkLineOfSight(): boolean {
        // Very basic LOS checking (just alignment)
        for (const e of this.game.entities) {
            if (e instanceof Enemy) {
                const dx = Math.abs(e.x - this.x);
                const dy = Math.abs(e.y - this.y);
                if (dx < 30 && ((this.dir === 'up' && e.y < this.y) || (this.dir === 'down' && e.y > this.y))) return true;
                if (dy < 30 && ((this.dir === 'left' && e.x < this.x) || (this.dir === 'right' && e.x > this.x))) return true;
            }
        }
        return false;
    }

    private pickNewDirection() {
        const dirs: Direction[] = ['up', 'down', 'left', 'right'];

        // Find nearest enemy to bias movement towards them
        let nearestDist = Infinity;
        let nearestEnemy: Enemy | null = null;
        for (const e of this.game.entities) {
            if (e instanceof Enemy) {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = e;
                }
            }
        }

        if (nearestEnemy) {
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            // Bias towards the larger distance
            if (Math.abs(dx) > Math.abs(dy)) {
                this.dir = dx > 0 ? 'right' : 'left';
                // chance to do maneuver
                if (Math.random() < 0.3) this.dir = Math.random() < 0.5 ? 'up' : 'down';
            } else {
                this.dir = dy > 0 ? 'down' : 'up';
                if (Math.random() < 0.3) this.dir = Math.random() < 0.5 ? 'left' : 'right';
            }
        } else {
            this.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
    }

    public shoot() {
        let bx = this.x + this.width / 2 - 3;
        let by = this.y + this.height / 2 - 3;

        if (this.dir === 'up') by -= 25;
        if (this.dir === 'down') by += 25;
        if (this.dir === 'left') bx -= 25;
        if (this.dir === 'right') bx += 25;

        // Ally shoots normal bullets
        const bullet = new Bullet(this.game, bx, by, this.dir, this);
        this.game.addEntity(bullet);
        this.cooldown = this.fireRate;
        AudioEngine.playShoot(); // share player shoot sound
    }

    public destroy() {
        for (let i = 0; i < 20; i++) {
            this.game.addEntity(new Particle(this.game, this.x + 20, this.y + 20, '#FF5E7E'));
            this.game.addEntity(new Particle(this.game, this.x + 20, this.y + 20, '#ffffff'));
        }
        this.game.removeEntity(this);
    }

    public draw(ctx: CanvasRenderingContext2D) {
        // Blink if dying
        if (this.lifeTimer < 3000 && Math.floor(this.lifeTimer / 100) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.dir === 'up') ctx.rotate(0);
        else if (this.dir === 'right') ctx.rotate(Math.PI / 2);
        else if (this.dir === 'down') ctx.rotate(Math.PI);
        else if (this.dir === 'left') ctx.rotate(-Math.PI / 2);

        // Shrink visual size to 80% to fit better inside the 50x50 hit box
        ctx.scale(0.8, 0.8);

        // Pink/Grapefruit chassis
        ctx.fillStyle = '#FF5E7E';
        ctx.fillRect(-25, -25, 50, 50);

        // Tracks (darker pink/red)
        ctx.fillStyle = '#A31F3A';
        ctx.fillRect(-25, -25, 10, 50);
        ctx.fillRect(15, -25, 10, 50);

        // Core / Turret (bright white/pink)
        ctx.fillStyle = '#FFF0F5';
        ctx.fillRect(-12.5, -12.5, 25, 25);

        // Cannon barrel
        ctx.fillStyle = '#FF5E7E';
        ctx.fillRect(-2.5, -31, 5, 18);

        ctx.restore();

        // Draw life bar
        const maxLife = 30000;
        const lifePct = Math.max(0, this.lifeTimer / maxLife);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x, this.y - 8, this.width, 4);
        ctx.fillStyle = '#FF5E7E';
        ctx.fillRect(this.x, this.y - 8, this.width * lifePct, 4);
    }
}
