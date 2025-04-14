// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCpAdi55yaEr78W3Hc-_j9FN_snS7z5mRI",
  authDomain: "syainn-8ae20.firebaseapp.com",
  databaseURL: "https://syainn-8ae20-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "syainn-8ae20",
  storageBucket: "syainn-8ae20.appspot.com",
  messagingSenderId: "797239462271",
  appId: "1:797239462271:web:279ffed9c84ca01772724a",
  measurementId: "G-PKJ4GG8ZQQ"
};

// Firebaseの初期化とエラーハンドリング
try {
  // Firebaseアプリの初期化
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  console.log("Firebase initialized successfully");
  
  // Realtime Databaseへの参照を取得
  const database = firebase.database();
  
  // データベース接続のテスト
  database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
      console.log('データベースに接続しました');
    } else {
      console.log('データベースから切断されました');
    }
  });
  
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

  // ローカルイベント用のリスナー（同じデバイス内での通信用）
  window.addEventListener('storage', function(e) {
    if (e.key === 'gameState') {
      console.log("Local storage changed:", e.newValue);
      if (e.newValue) {
        try {
          const localGameState = JSON.parse(e.newValue);
          // Firebaseが接続されていない場合にのみローカルストレージの変更を反映
          if (fbConnectionError) {
            updateGameDisplay(localGameState);
          }
        } catch (error) {
          console.error("Error parsing local storage:", error);
        }
      }
    }
  });

  // マスター側：ゲーム開始
  startGameBtn.addEventListener('click', () => {
      console.log("Starting game...");
      statusMessage.textContent = "ゲーム開始中...";
      
      // 画像パスを設定 - フルパスを使用
      const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
      const imagePath = baseUrl + 'puzzle.png';
      console.log("Image path:", imagePath);
      
      // ゲームの状態オブジェクト
      const gameState = {
        gameStarted: true,
        imagePath: imagePath,
        timestamp: Date.now()
      };
      
      // ローカルストレージにも状態を保存（フォールバック用）
      localStorage.setItem('gameState', JSON.stringify(gameState));
      
      // ゲーム状態を更新
      gameStateRef.set({
          gameStarted: true,
          imagePath: imagePath,
          timestamp: firebase.database.ServerValue.TIMESTAMP
      })
      .then(() => {
          console.log("Game state updated successfully");
          statusMessage.textContent = "ゲームが開始されました！";
          
          // ローカル表示も更新
          updateGameDisplay(gameState);
      })
      .catch(error => {
          console.error("Error updating game state:", error);
          statusMessage.textContent = "Firebase更新エラー (ローカルモードで動作中): " + error.message;
          
          // Firebase更新に失敗した場合でもローカル表示を更新
          updateGameDisplay(gameState);
      });
  });

  // マスター側：リセット
  resetGameBtn.addEventListener('click', () => {
      console.log("Resetting game...");
      statusMessage.textContent = "リセット中...";
      
      // ゲームの状態オブジェクト
      const gameState = {
        gameStarted: false,
        imagePath: '',
        timestamp: Date.now()
      };
      
      // ローカルストレージの状態もリセット
      localStorage.setItem('gameState', JSON.stringify(gameState));
      
      // ゲーム状態をリセット
      gameStateRef.set({
          gameStarted: false,
          imagePath: '',
          timestamp: firebase.database.ServerValue.TIMESTAMP
      })
      .then(() => {
          console.log("Game state reset successfully");
          statusMessage.textContent = "リセットされました";
          
          // ローカル表示も更新
          updateGameDisplay(gameState);
      })
      .catch(error => {
          console.error("Error resetting game state:", error);
          statusMessage.textContent = "Firebaseリセットエラー (ローカルモードで動作中): " + error.message;
          
          // Firebase更新に失敗した場合でもローカル表示を更新
          updateGameDisplay(gameState);
      });
  });

  // プレイヤー側：ゲーム状態の監視
  let fbConnectionError = false;
  
  gameStateRef.on('value', (snapshot) => {
      console.log("Game state changed:", snapshot.val());
      fbConnectionError = false;
      const gameState = snapshot.val();
      updateGameDisplay(gameState);
  }, (error) => {
      console.error("Error getting game state:", error);
      fbConnectionError = true;
      
      // Firebaseからの取得に失敗した場合、ローカルストレージを使用
      const localGameState = JSON.parse(localStorage.getItem('gameState'));
      if (localGameState) {
        console.log("Using local game state:", localGameState);
        updateGameDisplay(localGameState);
      }
  });
  
  // ゲーム表示の更新関数
  function updateGameDisplay(gameState) {
    if (gameState && gameState.gameStarted) {
        // ゲームが開始されたら画像を表示
        const contentP = document.querySelector('#game-content p');
        contentP.textContent = 'ゲームが開始されました！';
        contentP.classList.add('game-started');
        
        // 画像を表示（画像がない場合はフォールバック）
        console.log("Showing image:", gameState.imagePath);
        if (!gameState.imagePath || gameState.imagePath === '') {
            // 画像パスがない場合はローカルのパスを使用
            const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            const fallbackPath = baseUrl + 'puzzle.png';
            imageContainer.innerHTML = `<img src="${fallbackPath}" alt="ゲーム画像">`;
        } else {
            imageContainer.innerHTML = `<img src="${gameState.imagePath}" alt="ゲーム画像" onerror="this.onerror=null; const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1); this.src=baseUrl+'puzzle.png'; console.log('Fallback to local path');">`;
        }
    } else {
        // ゲームがリセットされたら待機状態に戻す
        const contentP = document.querySelector('#game-content p');
        contentP.textContent = 'マスターがゲームを開始するのを待っています...';
        contentP.classList.remove('game-started');
        imageContainer.innerHTML = '';
        console.log("Waiting for game to start");
    }
  }

  // 初期化時にFirebaseのゲーム状態を確認
  gameStateRef.once('value')
  .then((snapshot) => {
      const gameState = snapshot.val();
      console.log("Initial game state:", gameState);
      
      // データがなければ初期値を設定
      if (!gameState) {
          const initialState = {
              gameStarted: false,
              imagePath: '',
              timestamp: firebase.database.ServerValue.TIMESTAMP
          };
          
          // ローカルストレージにも保存
          localStorage.setItem('gameState', JSON.stringify({
            gameStarted: false,
            imagePath: '',
            timestamp: Date.now()
          }));
          
          return gameStateRef.set(initialState);
      }
  })
  .then(() => {
      console.log("Initial game state set successfully");
  })
  .catch(error => {
      console.error("Error setting initial game state:", error);
      
      // Firebaseの初期化に失敗した場合、ローカルストレージのデータを使用
      const localGameState = JSON.parse(localStorage.getItem('gameState'));
      if (localGameState) {
        console.log("Using local game state:", localGameState);
        updateGameDisplay(localGameState);
      } else {
        // ローカルストレージにもデータがない場合は初期状態を設定
        localStorage.setItem('gameState', JSON.stringify({
          gameStarted: false,
          imagePath: '',
          timestamp: Date.now()
        }));
      }
  });
  
  // 定期的にFirebase接続を確認（5秒ごと）
  setInterval(() => {
    if (fbConnectionError) {
      // 再接続を試みる
      gameStateRef.once('value')
        .then(snapshot => {
          console.log("Reconnected to Firebase");
          fbConnectionError = false;
          updateGameDisplay(snapshot.val());
        })
        .catch(error => {
          console.log("Still disconnected from Firebase:", error.message);
        });
    }
  }, 5000);
  
} catch (error) {
  console.error("Firebase initialization error:", error);
} 