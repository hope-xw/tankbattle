import './style.css';
import { Game } from './core/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

document.getElementById('start-btn')?.addEventListener('click', () => {
  document.getElementById('main-menu')?.classList.add('hidden');
  game.start();
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  document.getElementById('game-over')?.classList.add('hidden');
  game.start();
});
