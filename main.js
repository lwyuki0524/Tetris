import Phaser from 'phaser';
import GameScene from './gameScene.js';

const config = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'phaser-game-container',
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: [GameScene],
  backgroundColor: '#f0f8ff'
};

const game = new Phaser.Game(config);