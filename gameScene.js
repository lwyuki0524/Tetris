import Phaser from 'phaser';
import TetrisLogic from './tetrisLogic.js';
import UIManager from './uiManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('tetrisTile', './assets/efabf371-7418-4c42-ba17-23ab3b5cc32d.png'); // https://play.rosebud.ai/assets/tetrisTile.png?iS6t
    this.load.image('tetrisBackground', './assets/1b12ce6e-bd2d-428c-85bf-f8fe055843f1.png'); //https://play.rosebud.ai/assets/tetrisBackground.png?CSt5
    this.load.image('nextPiecePanel', './assets/cfd6e024-e2ac-431c-aacc-98e75417eea3.png'); // https://play.rosebud.ai/assets/nextPiecePanel.png?BY30
    this.load.image('scorePanel', './assets/6c74184e-bd9e-4ba5-8605-9b9e4fa9c5ef.png'); //https://play.rosebud.ai/assets/scorePanel.png?RvQa
    this.load.image('playButton', './assets/76930db4-610e-41a5-bdae-b59e6ec04a98.png'); // https://play.rosebud.ai/assets/playButton.png?YUDc
  }

  create() {
    // Add background
    const bg = this.add.image(512, 384, 'tetrisBackground');
    bg.setDisplaySize(1024, 768);

    // Initialize game systems
    this.tetrisLogic = new TetrisLogic(this);
    this.uiManager = new UIManager(this);

    // 畫出遊戲區域外框（確保與邏輯一致）
    const boardX = this.tetrisLogic.BOARD_X;
    const boardY = this.tetrisLogic.BOARD_Y;
    const boardWidth = this.tetrisLogic.BOARD_WIDTH * this.tetrisLogic.TILE_SIZE;
    const boardHeight = this.tetrisLogic.BOARD_HEIGHT * this.tetrisLogic.TILE_SIZE;

    // 先清除舊的外框（避免重複）
    if (this.boardFrame) this.boardFrame.destroy();
    this.boardFrame = this.add.graphics();
    this.boardFrame.lineStyle(2, 0x8A4FFF, 1); // 紫色外框
    this.boardFrame.strokeRect(boardX-10, boardY, boardWidth+5, boardHeight-10);
    // ↑ 多加2像素讓外框包住邊緣

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.startElements = [];

    // 手機專用虛擬按鈕
    this.mobileButtons = [];
    if (this.isMobile()) {
      this.createMobileControls();
    }

    // 暫停狀態
    this.isPaused = false;

    // 監聽 P 鍵切換暫停
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    
    // 連發控制
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.leftKeyRepeatTimer = 0;
    this.rightKeyRepeatTimer = 0;
    this.keyRepeatDelay = 70; // 毫秒
    
    // Show start screen
    this.showStartScreen();
    
    // Setup update timer
    this.dropTimer = 0;
    this.dropSpeed = 500; // milliseconds
  }

  isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return window.innerWidth <= 768 || /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  }

  createMobileControls() {
    // 透明度
    const alpha = 0.7;
    // 左
    const leftBtn = this.add.rectangle(120, 650, 80, 80, 0x8A4FFF, alpha)
      .setInteractive()
      .setScrollFactor(0);
    this.add.text(120, 650, '←', { fontSize: '48px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    
    // 長按自動移動
    let leftInterval = null;
    leftBtn.on('pointerdown', () => {
      if (this.isPaused) return; // 暫停時不動作
      this.tetrisLogic.movePieceLeft();
      leftInterval = setInterval(() => {
        if (!this.isPaused) this.tetrisLogic.movePieceLeft();
      }, 100);
    });
    leftBtn.on('pointerup', () => {
      clearInterval(leftInterval);
      leftInterval = null;
    });
    leftBtn.on('pointerout', () => {
      clearInterval(leftInterval);
      leftInterval = null;
    });
    this.mobileButtons.push(leftBtn);

    // 右
    const rightBtn = this.add.rectangle(280, 650, 80, 80, 0x8A4FFF, alpha)
      .setInteractive()
      .setScrollFactor(0);
    this.add.text(280, 650, '→', { fontSize: '48px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    // 長按自動移動
    let rightInterval = null;
    rightBtn.on('pointerdown', () => {
      if (this.isPaused) return; // 暫停時不動作
      this.tetrisLogic.movePieceRight();
      rightInterval = setInterval(() => {
        if (!this.isPaused) this.tetrisLogic.movePieceRight();
      }, 100);
    });
    rightBtn.on('pointerup', () => {
      clearInterval(rightInterval);
      rightInterval = null;
    });
    rightBtn.on('pointerout', () => {
      clearInterval(rightInterval);
      rightInterval = null;
    });
    this.mobileButtons.push(rightBtn);

    // 旋轉
    const rotateBtn = this.add.rectangle(800, 650, 80, 80, 0x4ECDC4, alpha)
      .setInteractive()
      .setScrollFactor(0);
    this.add.text(800, 650, '⟳', { fontSize: '48px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    rotateBtn.on('pointerdown', () => {
      if (this.isPaused) return; // 暫停時不動作
      this.tetrisLogic.rotatePiece()
    });
    this.mobileButtons.push(rotateBtn);

    // 下落
    const downBtn = this.add.rectangle(940, 650, 80, 80, 0xFF6B6B, alpha)
      .setInteractive()
      .setScrollFactor(0);
    this.add.text(940, 650, '↓', { fontSize: '48px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    // 長按自動下落
    let downInterval = null;
    downBtn.on('pointerdown', () => {
      if (this.isPaused) return; // 暫停時不動作
      this.tetrisLogic.movePieceDown();
      downInterval = setInterval(() => {
        if (!this.isPaused) this.tetrisLogic.movePieceDown();
      }, 100);
    });
    downBtn.on('pointerup', () => {
      clearInterval(downInterval);
      downInterval = null;
    });
    downBtn.on('pointerout', () => {
      clearInterval(downInterval);
      downInterval = null;
    });
    this.mobileButtons.push(downBtn);

    // 暫停
    this.pauseBtnBg = this.add.rectangle(60, 50, 100, 50, 0x888888, alpha)
      .setInteractive()
      .setScrollFactor(0);
    this.pauseBtnText = this.add.text(60, 50, '暫停', { fontSize: '24px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    this.pauseBtnBg.on('pointerdown', () => this.togglePause());
    this.mobileButtons.push(this.pauseBtnBg);
  }

  showStartScreen() {
    const playBtn = this.add.image(512, 400, 'playButton');
    playBtn.setDisplaySize(120, 120);
    playBtn.setInteractive();
    playBtn.on('pointerdown', () => {
      playBtn.destroy();
      this.startGame();
    });
    
    const title = this.add.text(512, 200, 'PASTEL TETRIS', {
      fontSize: '48px',
      fill: '#8A4FFF',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    const instructions = this.add.text(512, 500, 'Arrow Keys or WASD to move\nUp/W to rotate\nDown/S to drop faster', {
      fontSize: '20px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.startElements = [title, instructions];
  }

  startGame() {
    this.startElements.forEach(el => el.destroy());
    this.gameStarted = true;
    this.tetrisLogic.initialize();
    this.uiManager.initialize();
  }

  update(time, delta) {
    
    // 暫停時不更新遊戲
    if (!this.gameStarted || this.gameOver) return;

    // 處理暫停鍵
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }

    // 暫停時不更新遊戲邏輯
    if (this.isPaused) return;

    this.handleInput();

    // 左鍵連發
    if (this.leftKey.isDown && !Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      if (this.leftKeyRepeatTimer <= 0) {
        this.tetrisLogic.movePieceLeft();
        this.leftKeyRepeatTimer = this.keyRepeatDelay;
      } else {
        this.leftKeyRepeatTimer -= delta;
      }
    } else {
      this.leftKeyRepeatTimer = 0;
    }

    // 右鍵連發
    if (this.rightKey.isDown && !Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      if (this.rightKeyRepeatTimer <= 0) {
        this.tetrisLogic.movePieceRight();
        this.rightKeyRepeatTimer = this.keyRepeatDelay;
      } else {
        this.rightKeyRepeatTimer -= delta;
      }
    } else {
      this.rightKeyRepeatTimer = 0;
    }
    
    // Auto drop pieces
    this.dropTimer += delta;
    if (this.dropTimer >= this.dropSpeed) {
      this.tetrisLogic.movePieceDown();
      this.dropTimer = 0;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseText = this.add.text(512, 384, 'PAUSED', {
        fontSize: '48px',
        fill: '#888',
        fontFamily: 'Arial Black'
      }).setOrigin(0.5);
      if (this.pauseBtnText) this.pauseBtnText.setText('取消暫停');
    } else {
      if (this.pauseText) {
        this.pauseText.destroy();
        this.pauseText = null;
      }
      if (this.pauseBtnText) this.pauseBtnText.setText('暫停');
    }
  }

  handleInput() {
    const leftPressed = this.cursors.left.isDown || this.wasd.A.isDown;
    const rightPressed = this.cursors.right.isDown || this.wasd.D.isDown;
    const downPressed = this.cursors.down.isDown || this.wasd.S.isDown;
    const rotatePressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.tetrisLogic.movePieceLeft();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.tetrisLogic.movePieceRight();
    }
    if (rotatePressed) {
      this.tetrisLogic.rotatePiece();
    }
    if (downPressed) {
      this.dropTimer = this.dropSpeed; // Force immediate drop
    }
  }

  endGame() {
    this.gameOver = true;
    this.add.text(512, 300, 'GAME OVER', {
      fontSize: '48px',
      fill: '#FF6B6B',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(512, 400, 'Click to Restart', {
      fontSize: '24px',
      fill: '#4ECDC4',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    restartBtn.setInteractive();
    restartBtn.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}