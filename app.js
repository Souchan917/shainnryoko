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

// Firebase初期化
firebase.initializeApp(firebaseConfig);
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
    // ゲーム状態を更新
    gameStateRef.set({
        gameStarted: true,
        imagePath: 'puzzle.png', // 表示する画像のパス
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
});

// マスター側：リセット
resetGameBtn.addEventListener('click', () => {
    // ゲーム状態をリセット
    gameStateRef.set({
        gameStarted: false,
        imagePath: '',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
});

// プレイヤー側：ゲーム状態の監視
gameStateRef.on('value', (snapshot) => {
    const gameState = snapshot.val();
    
    if (gameState && gameState.gameStarted) {
        // ゲームが開始されたら画像を表示
        document.querySelector('#game-content p').textContent = 'ゲームが開始されました！';
        
        // 画像を表示
        imageContainer.innerHTML = `<img src="${gameState.imagePath}" alt="ゲーム画像">`;
    } else {
        // ゲームがリセットされたら待機状態に戻す
        document.querySelector('#game-content p').textContent = 'マスターがゲームを開始するのを待っています...';
        imageContainer.innerHTML = '';
    }
});

// 初期化時にFirebaseのゲーム状態を確認
gameStateRef.once('value').then((snapshot) => {
    const gameState = snapshot.val();
    
    // データがなければ初期値を設定
    if (!gameState) {
        gameStateRef.set({
            gameStarted: false,
            imagePath: '',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }
}); 