import Phaser from 'phaser';
import TetrisLogic from './tetrisLogic.js';
import UIManager from './uiManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    const assets = [
      ['tetrisTile', 'efabf371-7418-4c42-ba17-23ab3b5cc32d.png'],       // https://play.rosebud.ai/assets/tetrisTile.png?iS6t
      ['tetrisBackground', '1b12ce6e-bd2d-428c-85bf-f8fe055843f1.png'], //https://play.rosebud.ai/assets/tetrisBackground.png?CSt5
      ['nextPiecePanel', 'cfd6e024-e2ac-431c-aacc-98e75417eea3.png'],   // https://play.rosebud.ai/assets/nextPiecePanel.png?BY30
      ['scorePanel', '6c74184e-bd9e-4ba5-8605-9b9e4fa9c5ef.png'],       //https://play.rosebud.ai/assets/scorePanel.png?RvQa
      ['playButton', '76930db4-610e-41a5-bdae-b59e6ec04a98.png']        // https://play.rosebud.ai/assets/playButton.png?YUDc
    ];
    assets.forEach(([key, img]) => this.load.image(key, `./assets/img/${img}`));
    // 加入音效
    this.load.audio('bgm', './assets/audio/bgm.mp3');
    this.load.audio('move', './assets/audio/drop.mp3');
    this.load.audio('rotate', './assets/audio/drop.mp3');
    this.load.audio('drop', './assets/audio/drop.mp3');
    this.load.audio('clear', './assets/audio/clear.mp3');
    this.load.audio('gameover', './assets/audio/game over.mp3');
  }

  create() {
    // Add background
    const screenW = this.sys.game.config.width;
    const screenH = this.sys.game.config.height;
    this.add.image(screenW / 2, screenH / 2, 'tetrisBackground').setDisplaySize(screenW, screenH);

    // Initialize game systems
    this.tetrisLogic = new TetrisLogic(this);
    this.uiManager = new UIManager(this);

    // 畫出遊戲區域外框（確保與邏輯一致）
    const logic = this.tetrisLogic;
    const boardWidth = logic.BOARD_WIDTH * logic.TILE_SIZE;
    const boardHeight = logic.BOARD_HEIGHT * logic.TILE_SIZE;
    const boardX = (screenW - boardWidth) / 2;
    const boardY = (screenH - boardHeight) / 2;

    // 設定給 tetrisLogic，讓邏輯與顯示一致
    logic.BOARD_X = boardX;
    logic.BOARD_Y = boardY;

    // 音效開關狀態
    this.soundMuted = false;

    // 加入音效開關按鈕
    const muteBtnSize = 40;
    this.muteBtn = this.add.rectangle(screenW*0.9, 25, muteBtnSize, muteBtnSize, 0x888888, 0.7)
      .setInteractive()
      .setScrollFactor(0);
    this.muteBtnText = this.add.text(screenW*0.9, 25, '🔊', {
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5).setScrollFactor(0);

    this.muteBtn.on('pointerdown', () => {
      this.soundMuted = !this.soundMuted;
      this.sound.mute = this.soundMuted;
      this.muteBtnText.setText(this.soundMuted ? '🔇' : '🔊');
    });
    
    // 初始化音效
    this.sounds = {
      move: this.sound.add('move'),
      rotate: this.sound.add('rotate'),
      drop: this.sound.add('drop'),
      clear: this.sound.add('clear'),
      gameover: this.sound.add('gameover')
    };

    
    // 加入背景音樂並循環播放
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
    this.bgm.play();
    
    // 先清除舊的外框（避免重複）
    this.boardFrame?.destroy();
    this.boardFrame = this.add.graphics();
    this.boardFrame.lineStyle(2, 0x8A4FFF, 1); // 紫色外框
    this.boardFrame.strokeRect(boardX-10, boardY, boardWidth+5, boardHeight-10);
    // ↑ 多加2像素讓外框包住邊緣

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);     // 監聽 P 鍵切換暫停
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);   // 連發控制
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.leftKeyRepeatTimer = 0;
    this.rightKeyRepeatTimer = 0;
    this.keyRepeatDelay = 70; // 毫秒

    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.isPaused = false;    // 暫停狀態
    this.startElements = [];
    this.mobileButtons = [];  // 手機專用虛擬按鈕
    
    // Setup update timer
    this.dropTimer = 0;
    this.dropSpeed = 500; // milliseconds

    if (this.isMobile()) this.createMobileControls();

    // Show start screen
    this.showStartScreen();
    
  }

  isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return window.innerWidth <= 768 || window.innerHeight <= 1000 || window.innerWidth <= window.innerHeight || /android|iphone|ipad|ipod|blackberry|iemobile|surface|opera mini|mobile/i.test(ua);
  }

  createMobileControls() {
    // 根據螢幕寬度調整
    const screenW = this.sys.game.config.width;
    const screenH = this.sys.game.config.height;
    const logic = this.tetrisLogic
    const boardX = logic.BOARD_X;
    const boardY = logic.BOARD_Y;
    const boardWidth = logic.BOARD_WIDTH * logic.TILE_SIZE;
    const boardHeight = logic.BOARD_HEIGHT * logic.TILE_SIZE;

    const btnSize = Math.floor(boardWidth / 5); // 按鈕大小與間距
    const gap = btnSize * 0.3;
    const margin = btnSize * 0.3;
    const btnY = screenH - margin - btnSize / 2;
    // const btnY = boardY + boardHeight + btnSize * 0.8; // 棋盤下方一點
    const alpha = 0.7;  // 透明度

    const layout = {
      left:  screenW * 0.1 + margin + btnSize / 2,
      right: screenW * 0.1 + margin + btnSize * 1.5 + gap,
      rotate: screenW * 0.9 - margin - btnSize * 1.5 - gap,
      down: screenW * 0.9 - margin - btnSize / 2
    };

    const makeBtn = (x, label, color, onDown, onHold = null) => {
      const btn = this.add.rectangle(x, btnY, btnSize, btnSize, color, alpha)
        .setInteractive().setScrollFactor(0);
      this.add.text(x, btnY, label, {
        fontSize: `${btnSize * 0.7}px`,
        color: '#fff'
      }).setOrigin(0.5).setScrollFactor(0);
      
      // 長按自動移動
      let holdTimer = null;
      btn.on('pointerdown', () => {
        if (this.isPaused) return; // 暫停時不動作
        onDown();
        if (onHold) {
          holdTimer = setInterval(() => { if (!this.isPaused) onHold(); }, 100);
        }
      });
      btn.on('pointerup', () => clearInterval(holdTimer));
      btn.on('pointerout', () => clearInterval(holdTimer));

      this.mobileButtons.push(btn);
    };

    makeBtn(layout.left,  '←', 0x8A4FFF, () => logic.movePieceLeft(),  () => logic.movePieceLeft());
    makeBtn(layout.right, '→', 0x8A4FFF, () => logic.movePieceRight(), () => logic.movePieceRight());
    makeBtn(layout.rotate,'⟳', 0x4ECDC4, () => logic.rotatePiece());
    makeBtn(layout.down,  '↓', 0xFF6B6B, () => logic.movePieceDown(), () => logic.movePieceDown());

    // 暫停
    this.pauseBtnBg = this.add.rectangle(screenW*0.1, 20, btnSize * 1.5, btnSize * 0.7, 0x888888, alpha).setInteractive().setScrollFactor(0);
    this.pauseBtnText = this.add.text(screenW*0.1, 20, '暫停', { fontSize: `${btnSize*0.3}px`, color: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    this.pauseBtnBg.on('pointerdown', () => this.togglePause());
    this.mobileButtons.push(this.pauseBtnBg);

  }

  showStartScreen() {
    const screenW = this.sys.game.config.width;
    const screenH = this.sys.game.config.height;

    const title = this.add.text(screenW / 2, screenH / 2 - 120, 'PASTEL TETRIS', {
      fontSize: '48px',
      fill: '#8A4FFF',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);

    const instructions = this.add.text(screenW / 2, screenH / 2 + 120, 'Arrow Keys or WASD to move\nUp/W to rotate\nDown/S to drop faster', {
      fontSize: '20px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const playBtn = this.add.image(screenW / 2, screenH / 2, 'playButton').setDisplaySize(120, 120).setInteractive();
    playBtn.on('pointerdown', () => {
      playBtn.destroy();
      this.startGame();
    });

    this.startElements = [title, instructions, playBtn];
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
    const screenW = this.sys.game.config.width;
    const screenH = this.sys.game.config.height;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseText = this.add.text(screenW / 2, screenH / 2 - 50, 'PAUSED', {
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
    this.sounds.gameover?.play();
    const screenW = this.sys.game.config.width;
    const screenH = this.sys.game.config.height;
    this.add.text(screenW / 2, screenH / 2 - 50, 'GAME OVER', {
      fontSize: '48px',
      fill: '#FF6B6B',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(screenW / 2, screenH / 2 + 50, 'Click to Restart', {
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