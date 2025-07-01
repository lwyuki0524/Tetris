export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.nextPieceSprites = [];
  }

  
  isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return window.innerWidth <= 768 || window.innerHeight <= 1000 || /android|iphone|ipad|ipod|blackberry|iemobile|surface|opera mini|mobile/i.test(ua);
  }

  initialize() {
    const logic = this.scene.tetrisLogic;
    const { BOARD_X: boardX, BOARD_Y: boardY, BOARD_WIDTH, BOARD_HEIGHT, TILE_SIZE } = logic;
    const boardWidth = BOARD_WIDTH * TILE_SIZE;
    const boardHeight = BOARD_HEIGHT * TILE_SIZE;
    const screenW = this.scene.sys.game.config.width;
    const isMobile = screenW < 900 || this.isMobile(); // 判斷是否手機

    const addPanel = (x, y, key, w=100, h=80) => {
      return this.scene.add.image(x, y, key).setDisplaySize(w, h);
    };

    const addText = (x, y, text, fontSize = '16px') => {
      return this.scene.add.text(x, y, text, {
        fontSize,
        fill: '#666',
        align: 'center',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    };

    let layout;

    if (isMobile) {
      // 手機：面板在棋盤上方
      const panelY = boardY - 90;
      const scoreX = boardX + boardWidth / 4;
      const nextX = boardX + boardWidth * 3 / 4;

      layout = {
        panelW: 100,
        panelH: 100,
        fontSize: "12px",
        scorePanel: { x: scoreX, y: panelY },
        nextPanel: { x: nextX, y: panelY },
        score: { x: scoreX, y: panelY -30 },
        lines: { x: scoreX, y: panelY },
        level: { x: scoreX, y: panelY + 30 },
        next: { x: nextX, y: panelY },
        nextText: { x: nextX, y: panelY - 25},
        nextPanel: { x: nextX, y: panelY }
      };
    }
    else {
      // 電腦：面板在棋盤右側
      const panelX = boardX + boardWidth + 100;
      const scoreY = boardY + 100;
      const nextY = boardY + 250;

      layout = {
        panelW: 150,
        panelH: 150,
        fontSize: "15px",
        scorePanel: { x: panelX, y: scoreY },
        nextPanel: { x: panelX, y: nextY },
        score: { x: panelX, y: scoreY - 50 },
        next: { x: panelX, y: nextY },
        level: { x: panelX, y: scoreY + 40 },
        lines: { x: panelX, y: scoreY - 5 },
        nextText: { x: panelX, y: nextY - 25 },
        nextPanel: { x: panelX, y: nextY }
      };
    }

    addPanel(layout.scorePanel.x, layout.scorePanel.y, 'scorePanel', layout.panelW, layout.panelH);
    addPanel(layout.nextPanel.x, layout.nextPanel.y, 'nextPiecePanel');

    this.scoreText = addText(layout.score.x, layout.score.y, 'SCORE\n0', layout.fontSize);
    this.linesText = addText(layout.lines.x, layout.lines.y, 'LINES\n0', layout.fontSize);
    this.levelText = addText(layout.level.x, layout.level.y, 'LEVEL\n1', layout.fontSize);
    this.nextPieceText = addText(layout.nextText.x, layout.nextText.y, 'NEXT', '12px');

    this.nextPanelInfo = {
      x: layout.nextPanel.x,
      y: layout.nextPanel.y,
      w: 100,
      h: 80
    };
  }

  updateScore(score, lines, level) {
    this.scoreText.setText(`SCORE\n${score}`);
    this.linesText.setText(`LINES\n${lines}`);
    this.levelText.setText(`LEVEL\n${level}`);
  }

  updateNextPiece(piece) {
    if (!this.nextPanelInfo) return;

    this.nextPieceSprites.forEach(sprite => sprite.destroy());
    this.nextPieceSprites = [];

    if (!piece) return;

    const { pieces, pieceColors } = this.scene.tetrisLogic;
    const shape = pieces[piece.type][0];
    const color = pieceColors[piece.type];
    const tileSize = 13;
    const { x, y } = this.nextPanelInfo;

    const shapeW = shape[0].length * tileSize;
    const shapeH = shape.length * tileSize;
    const startX = x - shapeW / 2;
    const startY = y - shapeH / 2 + tileSize / 2 + 15;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const sprite = this.scene.add.image(
            startX + col * tileSize,
            startY + row * tileSize,
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
