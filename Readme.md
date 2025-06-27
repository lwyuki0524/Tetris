# Pastel Dream Tetris

這是一個用 Phaser 製作的可愛粉彩風俄羅斯方塊遊戲。

## 遊戲玩法

- 使用鍵盤方向鍵或 WASD 控制方塊：
  - 左/右 或 A/D：左右移動方塊
  - 上 或 W：旋轉方塊
  - 下 或 S：加速下落

- 點擊「Play」按鈕開始遊戲。
- 遊戲結束時可點擊「Click to Restart」重新開始。

## 執行方式

**請勿直接用瀏覽器開啟 index.html，需使用本地伺服器！**

### 方法一：VS Code Live Server

1. 安裝 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 外掛。
2. 右鍵 `index.html` → 選「Open with Live Server」。
3. 瀏覽器會自動開啟 `http://localhost:xxxx`，即可遊玩。

### 方法二：Node.js http-server

1. 在專案資料夾（`d:\Documents\NAS\Projects`）開啟終端機。
2. 執行：
   ```
   npx http-server .
   ```
3. 用瀏覽器開啟顯示的 `http://localhost:8080`。

### 方法三：Python

1. 在專案資料夾開啟終端機。
2. 執行：
   ```
   python -m http.server 8000
   ```
3. 用瀏覽器開啟 `http://localhost:8000`。

---

## 檔案結構

- `index.html`：入口網頁
- `main.js`：Phaser 遊戲初始化
- `gameScene.js`：主要遊戲場景
- `tetrisLogic.js`：遊戲邏輯
- `uiManager.js`：UI 管理

---

## 注意事項

- 若有任何錯誤，請檢查瀏覽器 Console 訊息。

祝你遊戲愉快