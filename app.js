// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCpAdi55yaEr78W3Hc-_j9FN_snS7z5mRI",
  authDomain: "syainn-8ae20.firebaseapp.com",
  projectId: "syainn-8ae20",
  storageBucket: "syainn-8ae20.appspot.com",
  messagingSenderId: "797239462271",
  appId: "1:797239462271:web:279ffed9c84ca01772724a",
  measurementId: "G-PKJ4GG8ZQQ",
  databaseURL: "https://syainn-8ae20-default-rtdb.firebaseio.com"
};

// Firebaseの初期化とエラーハンドリング
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  
  const database = firebase.database();
  const gameStateRef = database.ref('gameState');

  // DOM要素
  const masterBtn = document.getElementById('master-btn');
  const playerBtn = document.getElementById('player-btn');
  const masterPanel = document.getElementById('master-panel');
  const playerPanel = document.getElementById('player-panel');
  const startGameBtn = document.getElementById('start-game');
  const resetGameBtn = document.getElementById('reset-game');
  const imageContainer = document.getElementById('image-container');
  const statusMessage = document.getElementById('status-message');

  // 役割選択
  masterBtn.addEventListener('click', () => {
      document.querySelector('.role-selector').classList.add('hidden');
      masterPanel.classList.remove('hidden');
  });

  playerBtn.addEventListener('click', () => {
      document.querySelector('.role-selector').classList.add('hidden');
      playerPanel.classList.remove('hidden');
  });

  // マスター側：ゲーム開始
  startGameBtn.addEventListener('click', () => {
      console.log("Starting game...");
      statusMessage.textContent = "ゲーム開始中...";
      
      // 画像パスを絶対パスに変更
      const imagePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'puzzle.png';
      console.log("Image path:", imagePath);
      
      // ゲーム状態を更新
      gameStateRef.set({
          gameStarted: true,
          imagePath: imagePath, // 絶対パスを使用
          timestamp: firebase.database.ServerValue.TIMESTAMP
      })
      .then(() => {
          console.log("Game state updated successfully");
          statusMessage.textContent = "ゲームが開始されました！";
      })
      .catch(error => {
          console.error("Error updating game state:", error);
          statusMessage.textContent = "エラーが発生しました: " + error.message;
      });
  });

  // マスター側：リセット
  resetGameBtn.addEventListener('click', () => {
      console.log("Resetting game...");
      // ゲーム状態をリセット
      gameStateRef.set({
          gameStarted: false,
          imagePath: '',
          timestamp: firebase.database.ServerValue.TIMESTAMP
      })
      .then(() => {
          console.log("Game state reset successfully");
      })
      .catch(error => {
          console.error("Error resetting game state:", error);
      });
  });

  // プレイヤー側：ゲーム状態の監視
  gameStateRef.on('value', (snapshot) => {
      console.log("Game state changed:", snapshot.val());
      const gameState = snapshot.val();
      
      if (gameState && gameState.gameStarted) {
          // ゲームが開始されたら画像を表示
          const contentP = document.querySelector('#game-content p');
          contentP.textContent = 'ゲームが開始されました！';
          contentP.classList.add('game-started');
          
          // 画像を表示
          console.log("Showing image:", gameState.imagePath);
          imageContainer.innerHTML = `<img src="${gameState.imagePath}" alt="ゲーム画像" onerror="this.onerror=null; this.src='puzzle.png'; console.log('Fallback to local path');">`;
      } else {
          // ゲームがリセットされたら待機状態に戻す
          document.querySelector('#game-content p').textContent = 'マスターがゲームを開始するのを待っています...';
          imageContainer.innerHTML = '';
          console.log("Waiting for game to start");
      }
  }, (error) => {
      console.error("Error getting game state:", error);
  });

  // 初期化時にFirebaseのゲーム状態を確認
  gameStateRef.once('value')
  .then((snapshot) => {
      const gameState = snapshot.val();
      console.log("Initial game state:", gameState);
      
      // データがなければ初期値を設定
      if (!gameState) {
          return gameStateRef.set({
              gameStarted: false,
              imagePath: '',
              timestamp: firebase.database.ServerValue.TIMESTAMP
          });
      }
  })
  .then(() => {
      console.log("Initial game state set successfully");
  })
  .catch(error => {
      console.error("Error setting initial game state:", error);
  });
  
} catch (error) {
  console.error("Firebase initialization error:", error);
} 