// アプリケーションロジック
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Firestoreへの参照を取得
    const db = firebase.firestore();
    console.log("app.jsでFirestore参照を取得しました");
    
    // コレクション参照
    const gameStateCollection = db.collection('gameState');
    const playersCollection = db.collection('players');
    
    // 初期設定 - gameStateコレクションにcurrentドキュメントが存在しない場合は作成
    gameStateCollection.doc('current').get()
      .then(doc => {
        if (!doc.exists) {
          return gameStateCollection.doc('current').set({
            gameStarted: false,
            imagePath: '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      })
      .then(() => {
        console.log('gameStateコレクションの初期化完了');
      })
      .catch(err => {
        console.error('gameStateコレクションの初期化エラー:', err);
      });
  
    // DOM要素
    const playerRegistration = document.getElementById('player-registration');
    const playerPanel = document.getElementById('player-panel');
    const masterPanel = document.getElementById('master-panel');
    const playerNameInput = document.getElementById('player-name');
    const registerPlayerBtn = document.getElementById('register-player-btn');
    const goToMasterBtn = document.getElementById('go-to-master-btn');
    const displayPlayerName = document.getElementById('display-player-name');
    const startGameBtn = document.getElementById('start-game');
    const resetGameBtn = document.getElementById('reset-game');
    const imageContainer = document.getElementById('image-container');
    const statusMessage = document.getElementById('status-message') || document.createElement('div'); // ステータスメッセージ要素がない場合の対策
    const connectedPlayersList = document.getElementById('connected-players');
    const backToRegistrationBtns = document.querySelectorAll('#back-to-registration');
  
    // 現在のプレイヤー情報
    let currentPlayer = {
      id: null,
      name: '',
      isActive: false,
      joinedAt: null
    };
  
    // 画面切り替え関数
    function showScreen(screenId) {
      // すべての画面を非表示
      playerRegistration.classList.remove('active-screen');
      playerRegistration.classList.add('hidden-screen');
      playerPanel.classList.remove('active-screen');
      playerPanel.classList.add('hidden-screen');
      masterPanel.classList.remove('active-screen');
      masterPanel.classList.add('hidden-screen');
      
      // 指定された画面を表示
      const targetScreen = document.getElementById(screenId);
      targetScreen.classList.remove('hidden-screen');
      targetScreen.classList.add('active-screen');
    }
  
    // プレイヤー登録処理
    registerPlayerBtn.addEventListener('click', () => {
      const playerName = playerNameInput.value.trim();
      
      if (!playerName) {
        alert('プレイヤー名を入力してください');
        return;
      }
      
      // プレイヤーIDを生成（ユニークIDまたはタイムスタンプ+ランダム値）
      const playerId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // プレイヤー情報を作成
      currentPlayer = {
        id: playerId,
        name: playerName,
        isActive: true,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Firestoreにプレイヤー情報を保存
      playersCollection.doc(playerId).set(currentPlayer)
        .then(() => {
          console.log('プレイヤー登録成功:', playerId);
          
          // プレイヤー名を表示
          displayPlayerName.textContent = playerName;
          
          // プレイヤー画面に遷移
          showScreen('player-panel');
          
          // ローカルストレージにプレイヤー情報を保存
          localStorage.setItem('currentPlayer', JSON.stringify({
            id: playerId,
            name: playerName
          }));
        })
        .catch(error => {
          console.error('プレイヤー登録エラー:', error);
          alert('プレイヤー登録に失敗しました。もう一度お試しください。');
        });
    });
  
    // マスター画面への移動
    goToMasterBtn.addEventListener('click', () => {
      showScreen('master-panel');
      updatePlayersList(); // プレイヤーリストを更新
      
      // 定期的にプレイヤーリストを更新
      setInterval(updatePlayersList, 5000);
    });
  
    // 登録画面に戻る処理
    backToRegistrationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 現在のプレイヤーをデータベースから削除（プレイヤーの場合）
        if (currentPlayer.id) {
          playersCollection.doc(currentPlayer.id).delete()
            .then(() => {
              console.log('プレイヤー情報を削除しました');
              // 現在のプレイヤー情報をリセット
              currentPlayer = {
                id: null,
                name: '',
                isActive: false,
                joinedAt: null
              };
            })
            .catch(error => {
              console.error('プレイヤー情報の削除に失敗:', error);
            });
        }
        
        // 登録画面に戻る
        showScreen('player-registration');
      });
    });
  
    // プレイヤーリストを更新する関数
    function updatePlayersList() {
      playersCollection.get()
        .then(snapshot => {
          // リストをクリア
          connectedPlayersList.innerHTML = '';
          
          if (!snapshot.empty) {
            // プレイヤー一覧を表示
            snapshot.forEach(doc => {
              const player = doc.data();
              const listItem = document.createElement('li');
              listItem.textContent = player.name;
              connectedPlayersList.appendChild(listItem);
            });
          } else {
            // プレイヤーがいない場合
            const listItem = document.createElement('li');
            listItem.textContent = '接続中のプレイヤーはいません';
            listItem.style.fontStyle = 'italic';
            listItem.style.color = '#666';
            connectedPlayersList.appendChild(listItem);
          }
        })
        .catch(error => {
          console.error('プレイヤーリスト取得エラー:', error);
        });
    }
  
    // ローカルイベント用のリスナー（同じデバイス内での通信用）
    window.addEventListener('storage', function(e) {
      if (e.key === 'gameState') {
        console.log("Local storage changed:", e.newValue);
        if (e.newValue) {
          try {
            const localGameState = JSON.parse(e.newValue);
            // Firestoreが接続されていない場合にのみローカルストレージの変更を反映
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
        if (statusMessage) statusMessage.textContent = "ゲーム開始中...";
        
        // 画像パスを設定 - フルパスを使用
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const imagePath = baseUrl + 'puzzle.png';
        console.log("Image path:", imagePath);
        
        // ゲームの状態オブジェクト
        const gameState = {
          gameStarted: true,
          imagePath: imagePath,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // ローカルストレージにも状態を保存（フォールバック用）
        localStorage.setItem('gameState', JSON.stringify({
          gameStarted: true,
          imagePath: imagePath,
          timestamp: Date.now()
        }));
        
        // ゲーム状態を更新（gameStateドキュメントに保存）
        gameStateCollection.doc('current').set(gameState)
        .then(() => {
            console.log("Game state updated successfully");
            if (statusMessage) statusMessage.textContent = "ゲームが開始されました！";
            
            // データベースから最新の状態を読み込んで確認
            return gameStateCollection.doc('current').get();
        })
        .then((doc) => {
            if (doc.exists) {
              console.log("確認: 書き込まれたデータ:", doc.data());
            }
            
            // ローカル表示も更新
            updateGameDisplay(gameState);
        })
        .catch(error => {
            console.error("Error updating game state:", error);
            if (statusMessage) statusMessage.textContent = "Firestore更新エラー (ローカルモードで動作中): " + error.message;
            
            // Firestore更新に失敗した場合でもローカル表示を更新
            updateGameDisplay({
              gameStarted: true,
              imagePath: imagePath,
              timestamp: Date.now()
            });
        });
    });
  
    // マスター側：リセット
    resetGameBtn.addEventListener('click', () => {
        console.log("Resetting game...");
        if (statusMessage) statusMessage.textContent = "リセット中...";
        
        // ゲームの状態オブジェクト
        const gameState = {
          gameStarted: false,
          imagePath: '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // ローカルストレージの状態もリセット
        localStorage.setItem('gameState', JSON.stringify({
          gameStarted: false,
          imagePath: '',
          timestamp: Date.now()
        }));
        
        // ゲーム状態をリセット
        gameStateCollection.doc('current').set(gameState)
        .then(() => {
            console.log("Game state reset successfully");
            if (statusMessage) statusMessage.textContent = "リセットされました";
            
            // データベースから最新の状態を読み込んで確認
            return gameStateCollection.doc('current').get();
        })
        .then((doc) => {
            if (doc.exists) {
              console.log("確認: リセット後のデータ:", doc.data());
            }
            
            // ローカル表示も更新
            updateGameDisplay({
              gameStarted: false,
              imagePath: '',
              timestamp: Date.now()
            });
        })
        .catch(error => {
            console.error("Error resetting game state:", error);
            if (statusMessage) statusMessage.textContent = "Firestore リセットエラー (ローカルモードで動作中): " + error.message;
            
            // Firestore更新に失敗した場合でもローカル表示を更新
            updateGameDisplay({
              gameStarted: false,
              imagePath: '',
              timestamp: Date.now()
            });
        });
    });
  
    // プレイヤー側：ゲーム状態の監視
    let fbConnectionError = false;
    let unsubscribeGameState = null;
    
    // ゲーム状態の監視を開始する関数
    function startGameStateListener() {
      // 古いリスナーがあれば解除
      if (unsubscribeGameState) {
        unsubscribeGameState();
      }
      
      // リアルタイムリスナーを設定
      unsubscribeGameState = gameStateCollection.doc('current')
        .onSnapshot((doc) => {
          console.log("Game state changed:", doc.exists ? doc.data() : null);
          fbConnectionError = false;
          
          if (doc.exists) {
            const gameState = doc.data();
            updateGameDisplay(gameState);
          } else {
            console.log("データベースにゲーム状態がありません");
            // 初期状態を設定
            const initialState = {
              gameStarted: false,
              imagePath: '',
              timestamp: Date.now()
            };
            updateGameDisplay(initialState);
          }
        }, (error) => {
          console.error("Error getting game state:", error);
          fbConnectionError = true;
          
          // Firestoreからの取得に失敗した場合、ローカルストレージを使用
          const localGameState = JSON.parse(localStorage.getItem('gameState'));
          if (localGameState) {
            console.log("Using local game state:", localGameState);
            updateGameDisplay(localGameState);
          }
        });
    }
    
    // ゲーム状態の監視を開始
    startGameStateListener();
    
    // ゲーム表示の更新関数
    function updateGameDisplay(gameState) {
      // ゲームコンテンツとイメージコンテナの存在確認
      const gameContent = document.querySelector('#game-content');
      if (!gameContent) {
        console.error('#game-content要素が見つかりません');
        return;
      }
      
      const contentP = gameContent.querySelector('p');
      if (!contentP) {
        console.error('#game-content内のp要素が見つかりません');
        return;
      }
      
      if (!imageContainer) {
        console.error('#image-container要素が見つかりません');
        return;
      }
      
      if (gameState && gameState.gameStarted) {
          // ゲームが開始されたら画像を表示
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
              // 画像の読み込みを非同期で行う
              const img = new Image();
              img.onload = function() {
                  console.log("画像の読み込みに成功しました");
                  imageContainer.innerHTML = '';
                  imageContainer.appendChild(img);
              };
              img.onerror = function() {
                  console.log("画像の読み込みに失敗しました。ローカルパスを使用します");
                  const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
                  img.src = baseUrl + 'puzzle.png';
              };
              img.src = gameState.imagePath;
              img.alt = "ゲーム画像";
              img.style.maxWidth = "100%";
              img.style.height = "auto";
              img.style.borderRadius = "8px";
              img.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
              
              // 読み込み中のメッセージを表示
              imageContainer.innerHTML = '<p>画像を読み込み中...</p>';
          }
      } else {
          // ゲームがリセットされたら待機状態に戻す
          contentP.textContent = 'マスターがゲームを開始するのを待っています...';
          contentP.classList.remove('game-started');
          imageContainer.innerHTML = '';
          console.log("Waiting for game to start");
      }
    }
  
    // 前回のプレイヤー情報があれば復元
    const savedPlayer = localStorage.getItem('currentPlayer');
    if (savedPlayer) {
      try {
        const playerData = JSON.parse(savedPlayer);
        if (playerData.name) {
          playerNameInput.value = playerData.name;
        }
      } catch (e) {
        console.error('保存されたプレイヤー情報の解析に失敗:', e);
      }
    }
  
    // 定期的にFirestore接続を確認（5秒ごと）
    setInterval(() => {
      if (fbConnectionError) {
        // 再接続を試みる
        db.collection('connectionTest').doc('test').set({
          timestamp: Date.now()
        })
        .then(() => {
          console.log("Firestore接続テスト成功 - 再接続完了");
          fbConnectionError = false;
          
          // ゲーム状態の監視を再開
          startGameStateListener();
        })
        .catch(error => {
          console.log("Still disconnected from Firestore:", error.message);
        });
      }
    }, 5000);
    
    // 非アクティブになる前に切断処理
    window.addEventListener('beforeunload', () => {
      // プレイヤー情報を削除（プレイヤーの場合）
      if (currentPlayer.id) {
        playersCollection.doc(currentPlayer.id).delete().catch(console.error);
      }
      
      // リスナーを解除
      if (unsubscribeGameState) {
        unsubscribeGameState();
      }
    });
    
  } catch (error) {
    console.error("App initialization error:", error);
    alert("アプリケーションエラー: " + error.message);
  }
}); 