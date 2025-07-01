export default class TetrisLogic {
  constructor(scene) {
    this.scene = scene;
    this.BOARD_WIDTH = 10;
    this.BOARD_HEIGHT = 25;
    this.TILE_SIZE = 25;
    this.BOARD_X = 350;
    this.BOARD_Y = 100;
    
    // Tetris pieces
    this.pieces = {
      I: [[[1,1,1,1]], [[1],[1],[1],[1]]],
      O: [[[1,1],[1,1]]],
      T: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]],
      S: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]],
      Z: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]],
      J: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]],
      L: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]]
    };
    
    this.pieceColors = {
      I: 0xBAE1FF, O: 0xFFFFBA, T: 0xE6BAFF, 
      S: 0xBAFFC9, Z: 0xFFB3BA, J: 0x87CEEB, L: 0xFFDFBA
    };
    
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.boardSprites = [];
    this.currentPieceSprites = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
  }

  initialize() {
    // Initialize empty board
    for (let y = 0; y < this.BOARD_HEIGHT; y++) {
      this.board[y] = [];
      this.boardSprites[y] = [];
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        this.board[y][x] = 0;
        this.boardSprites[y][x] = null;
      }
    }
    
    this.spawnNewPiece();
    this.spawnNextPiece();
  }

  spawnNewPiece() {
    if (this.nextPiece) {
      this.currentPiece = { ...this.nextPiece };
    } else {
      this.currentPiece = this.generateRandomPiece();
    }
    
    // 根據形狀寬度置中
    const shape = this.pieces[this.currentPiece.type][0];
    this.currentPiece.x = Math.floor((this.BOARD_WIDTH - shape[0].length) / 2);
    // this.currentPiece.x = Math.floor(this.BOARD_WIDTH / 2) - 1;
    this.currentPiece.y = 0;
    this.currentPiece.rotation = 0;
    
    // Check game over
    if (this.checkCollision(this.currentPiece)) {
      this.scene.endGame();
      return;
    }
    
    this.spawnNextPiece();
    this.updateCurrentPieceDisplay();
  }

  spawnNextPiece() {
    this.nextPiece = this.generateRandomPiece();
    this.scene.uiManager.updateNextPiece(this.nextPiece);
  }

  generateRandomPiece() {
    const pieceTypes = Object.keys(this.pieces);
    const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    return { type, rotation: 0, x: 0, y: 0 };
  }

  movePieceLeft() {
    this.currentPiece.x--;
    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.x++;
      return;
    }
    this.scene.sounds.move?.play();
    this.updateCurrentPieceDisplay();
  }

  movePieceRight() {
    this.currentPiece.x++;
    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.x--;
      return;
    }
    this.updateCurrentPieceDisplay();
  }

  movePieceDown() {
    this.currentPiece.y++;
    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.y--;
      this.lockPiece();
      return;
    }
    this.updateCurrentPieceDisplay();
  }

  rotatePiece() {
    const oldRotation = this.currentPiece.rotation;
    this.currentPiece.rotation = (this.currentPiece.rotation + 1) % this.pieces[this.currentPiece.type].length;
    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.rotation = oldRotation;
      return;
    }
    this.scene.sounds.rotate?.play();
    this.updateCurrentPieceDisplay();
  }

  checkCollision(piece) {
    const shape = this.pieces[piece.type][piece.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          
          if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
              boardY >= this.BOARD_HEIGHT ||
              (boardY >= 0 && this.board[boardY][boardX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  lockPiece() {
    const shape = this.pieces[this.currentPiece.type][this.currentPiece.rotation];
    const color = this.pieceColors[this.currentPiece.type];
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          
          if (boardY >= 0) {
            this.board[boardY][boardX] = 1;
            this.createBoardTile(boardX, boardY, color);
          }
        }
      }
    }
    this.scene.sounds.drop?.play();
    this.clearCurrentPieceSprites();
    this.checkLines();
    this.spawnNewPiece();
  }

  checkLines() {
    let linesCleared = 0;
    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell === 1)) {
        this.clearLine(y);
        linesCleared++;
        y++; // Check the same line again
      }
    }
    
    if (linesCleared > 0) {
      this.scene.sounds.clear?.play();
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.scene.dropSpeed = Math.max(50, 500 - (this.level - 1) * 50);
      this.scene.uiManager.updateScore(this.score, this.lines, this.level);
    }
  }

  clearLine(lineY) {
    // Remove sprites
    for (let x = 0; x < this.BOARD_WIDTH; x++) {
      if (this.boardSprites[lineY][x]) {
        this.boardSprites[lineY][x].destroy();
      }
    }
    
    // Move everything down
    for (let y = lineY; y > 0; y--) {
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        this.board[y][x] = this.board[y-1][x];
        this.boardSprites[y][x] = this.boardSprites[y-1][x];
        if (this.boardSprites[y][x]) {
          this.boardSprites[y][x].y += this.TILE_SIZE;
        }
      }
    }
    
    // Clear top line
    for (let x = 0; x < this.BOARD_WIDTH; x++) {
      this.board[0][x] = 0;
      this.boardSprites[0][x] = null;
    }
  }

  createBoardTile(x, y, color) {
    const sprite = this.scene.add.image(
      this.BOARD_X + x * this.TILE_SIZE,
      this.BOARD_Y + y * this.TILE_SIZE,
      'tetrisTile'
    );
    sprite.setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
    sprite.setTint(color);
    this.boardSprites[y][x] = sprite;
  }

  updateCurrentPieceDisplay() {
    this.clearCurrentPieceSprites();
    
    const shape = this.pieces[this.currentPiece.type][this.currentPiece.rotation];
    const color = this.pieceColors[this.currentPiece.type];
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const sprite = this.scene.add.image(
            this.BOARD_X + (this.currentPiece.x + x) * this.TILE_SIZE,
            this.BOARD_Y + (this.currentPiece.y + y) * this.TILE_SIZE,
            'tetrisTile'
          );
          sprite.setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);
          sprite.setTint(color);
          this.currentPieceSprites.push(sprite);
        }
      }
    }
  }

  clearCurrentPieceSprites() {
    this.currentPieceSprites.forEach(sprite => sprite.destroy());
    this.currentPieceSprites = [];
  }
}