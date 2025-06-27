export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.nextPieceSprites = [];
  }

  initialize() {
    // Score panel
    const scorePanel = this.scene.add.image(750, 200, 'scorePanel');
    scorePanel.setDisplaySize(200, 180);
    
    this.scoreText = this.scene.add.text(750, 150, 'SCORE\n0', {
      fontSize: '20px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.linesText = this.scene.add.text(750, 220, 'LINES\n0', {
      fontSize: '16px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.levelText = this.scene.add.text(750, 260, 'LEVEL\n1', {
      fontSize: '16px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Next piece panel
    const nextPanel = this.scene.add.image(750, 400, 'nextPiecePanel');
    nextPanel.setDisplaySize(180, 100);
    
    this.nextPieceText = this.scene.add.text(750, 360, 'NEXT', {
      fontSize: '18px',
      fill: '#666',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  updateScore(score, lines, level) {
    this.scoreText.setText(`SCORE\n${score}`);
    this.linesText.setText(`LINES\n${lines}`);
    this.levelText.setText(`LEVEL\n${level}`);
  }

  updateNextPiece(piece) {
    // Clear previous next piece display
    this.nextPieceSprites.forEach(sprite => sprite.destroy());
    this.nextPieceSprites = [];
    
    if (!piece) return;
    
    const shape = this.scene.tetrisLogic.pieces[piece.type][0];
    const color = this.scene.tetrisLogic.pieceColors[piece.type];
    const tileSize = 15;
    const startX = 750 - (shape[0].length * tileSize) / 2;
    const startY = 400 - (shape.length * tileSize) / 2;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const sprite = this.scene.add.image(
            startX + x * tileSize,
            startY + y * tileSize,
            'tetrisTile'
          );
          sprite.setDisplaySize(tileSize, tileSize);
          sprite.setTint(color);
          this.nextPieceSprites.push(sprite);
        }
      }
    }
  }
}