import { Game } from '../core/Game';
import { Tank } from './Tank';
import { Particle } from './Particle';
import { AudioEngine } from '../core/Audio';

export class Player extends Tank {
    public lives: number = 3;

    constructor(game: Game, x: number, y: number) {
        super(game, x, y);
        this.isEnemy = false;
        this.speed = 150;
        this.fireRate = 300;
    }

    public update(dt: number) {
        super.update(dt);

        if (this.game.input.keys['ArrowUp'] || this.game.input.keys['KeyW']) {
            this.move('up', dt);
        } else if (this.game.input.keys['ArrowDown'] || this.game.input.keys['KeyS']) {
            this.move('down', dt);
        } else if (this.game.input.keys['ArrowLeft'] || this.game.input.keys['KeyA']) {
            this.move('left', dt);
        } else if (this.game.input.keys['ArrowRight'] || this.game.input.keys['KeyD']) {
            this.move('right', dt);
        }

        if (this.game.input.keys['Space']) {
            this.fire();
        }
    }

    public destroy() {
        AudioEngine.playExplosion();
        // Massive explosion for player
        for (let i = 0; i < 30; i++) {
            const colors = ['#c0392b', '#d35400', '#f39c12'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, color, 2, 2.5, 'circle'));
        }
        for (let i = 0; i < 25; i++) {
            // heavy smoke
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#333', 1.5, 3, 'smoke'));
            // brilliant sparks
            this.game.addEntity(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#fff', 2.5, 1.5, 'spark'));
        }

        this.lives--;
        this.game.updateHUD();
        if (this.lives > 0) {
            // Respawn
            this.x = 50 * 4;
            this.y = 50 * 12;
            this.dir = 'up';
            this.isInvincible = true;
            this.powerUpTimers.shield = 4000; // 4 seconds invincibility on respawn
        } else {
            super.destroy(); // removes entity and does standard explosion again
            this.game.gameOver();
        }
    }
}
