console.log("Main.js loaded");
import Game from './src/engine/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  game.init();
});
