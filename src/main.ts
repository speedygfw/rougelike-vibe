console.log("Main.ts loaded");
import Game from './engine/Game.js';

window.onerror = function (msg, url, lineNo, columnNo, error) {
    alert('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nStack: ' + (error ? error.stack : 'n/a'));
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    alert('Unhandled Rejection: ' + event.reason);
});

window.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) throw new Error("Canvas not found");
        const game = new Game(canvas);
        game.init();
    } catch (e: any) {
        alert("Init Error: " + e.message);
    }
});
