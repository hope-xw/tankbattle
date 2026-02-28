import './style.css';
import { Game } from './core/Game';
import { SpriteManager } from './core/SpriteManager';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Prevent starting before assets are loaded
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
if (startBtn) startBtn.disabled = true;

SpriteManager.getInstance()
  .loadAll({
    base_explosion: '/assets/base_explosion.png',
    player_tank: '/assets/player_tank.png',
    enemy_green: '/assets/enemy_green.png',
    enemy_gray: '/assets/enemy_gray.png'
  })
  .then(() => {
    if (startBtn) startBtn.disabled = false;
  });

startBtn?.addEventListener('click', () => {
  document.getElementById('main-menu')?.classList.add('hidden');
  game.start();
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  document.getElementById('game-over')?.classList.add('hidden');
  game.start();
});
