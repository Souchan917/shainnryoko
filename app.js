// アプリケーションロジック
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Firestoreへの参照を取得
    const db = firebase.firestore();
    console.log("app.jsでFirestore参照を取得しました");
    
    // コレクション参照
    const gameStateCollection = db.collection('gameState');
    const playersCollection = db.collection('players');
    const answersCollection = db.collection('answers');
    
    // ゲームの正解（今回は「りんご」に設定）
    const CORRECT_ANSWER = "りんご";
    
    // ポイント設定
    const POINTS_CONFIG = {
      initial: 100,     // 初期ポイント
      correctAnswer: 50, // 正解時に獲得するポイント
      itemPurchase: {    // アイテム購入時の消費ポイント
        hint: 20,        // ヒント使用
        timeBonus: 30,   // 時間ボーナス
        skip: 100        // 問題スキップ
      }
    };
    
    // ユーティリティ関数 - データ管理 //
    
    // ローカルストレージへの保存
    function saveToLocalStorage(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error(`ローカルストレージへの保存エラー (${key}):`, e);
        return false;
      }
    }
    
    // ローカルストレージからの読み込み
    function loadFromLocalStorage(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error(`ローカルストレージからの読み込みエラー (${key}):`, e);
        return null;
      }
    }
    
    // ゲーム状態オブジェクトの作成
    function createGameState(started, imagePath = '', startTime = null) {
      return {
        gameStarted: started,
        imagePath,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        correctAnswer: CORRECT_ANSWER,
        startTime,
        points: POINTS_CONFIG.initial
      };
    }
    
    // ユーティリティ関数 - UI管理 //
    
    // 解答入力状態の設定
    function setAnswerInputState(enabled) {
      if (playerAnswer && submitAnswerBtn) {
        playerAnswer.disabled = !enabled;
        submitAnswerBtn.disabled = !enabled;
      }
    }
    
    // 解答入力欄のリセット
    function resetAnswerInput() {
      if (playerAnswer) playerAnswer.value = '';
      if (answerResult) {
        answerResult.textContent = '';
        answerResult.className = '';
      }
      if (answerTime) answerTime.textContent = '';
    }
    
    // プレイヤー表示の同期
    function syncPlayerDisplay() {
      // プレイヤー名の表示
      if (displayPlayerName && currentPlayer.name) {
        displayPlayerName.textContent = currentPlayer.name;
      }
      
      // ポイントの表示更新
      if (playerPointsDisplay && currentPlayer.points !== undefined) {
        updatePointsDisplay(currentPlayer.points);
      }
    }
    
    // 初期設定 - gameStateコレクションにcurrentドキュメントが存在しない場合は作成
    gameStateCollection.doc('current').get()
      .then(doc => {
        if (!doc.exists) {
          return gameStateCollection.doc('current').set(createGameState(false));
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
    const playerPointsDisplay = document.getElementById('player-points');
    const startGameBtn = document.getElementById('start-game');
    const resetGameBtn = document.getElementById('reset-game');
    const imageContainer = document.getElementById('image-container');
    const statusMessage = document.getElementById('status-message') || document.createElement('div'); // ステータスメッセージ要素がない場合の対策
    const connectedPlayersList = document.getElementById('connected-players');
    const backToRegistrationBtns = document.querySelectorAll('#back-to-registration');
    
    // 解答関連の要素
    const answerSection = document.getElementById('answer-section');
    const playerAnswer = document.getElementById('player-answer');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const answerResult = document.getElementById('answer-result');
    const answerTime = document.getElementById('answer-time');
    const playerAnswersList = document.getElementById('player-answers');
  
    console.log('DOM要素の参照結果:', {
      answerSection: !!answerSection,
      playerAnswer: !!playerAnswer,
      submitAnswerBtn: !!submitAnswerBtn,
      answerResult: !!answerResult,
      answerTime: !!answerTime,
      playerAnswersList: !!playerAnswersList
    });
  
    // 現在のプレイヤー情報
    let currentPlayer = {
      id: null,
      name: '',
      isActive: false,
      joinedAt: null,
      answered: false, // 解答済みかどうか
      answerCorrect: false, // 正解したかどうか
      points: POINTS_CONFIG.initial
    };
    
    // 解答した時刻を記録するための変数
    let gameStartTime = null;
  
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
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        answered: false,
        answerCorrect: false,
        points: POINTS_CONFIG.initial
      };
      
      // Firestoreにプレイヤー情報を保存
      playersCollection.doc(playerId).set(currentPlayer)
        .then(() => {
          console.log('プレイヤー登録成功:', playerId);
          
          // プレイヤー表示を同期（名前とポイント）
          syncPlayerDisplay();
          
          // プレイヤー画面に遷移
          showScreen('player-panel');
          
          // ローカルストレージにプレイヤー情報を保存
          saveToLocalStorage('currentPlayer', {
            id: playerId,
            name: playerName,
            points: POINTS_CONFIG.initial
          });
        })
        .catch(error => {
          console.error('プレイヤー登録エラー:', error);
          alert('プレイヤー登録に失敗しました。もう一度お試しください。');
        });
    });
  
    // ポイント表示を更新する関数
    function updatePointsDisplay(points) {
      if (playerPointsDisplay) {
        playerPointsDisplay.textContent = points;
        
        // ポイント変動時のアニメーション効果（オプション）
        playerPointsDisplay.classList.remove('points-updated');
        void playerPointsDisplay.offsetWidth; // リフロー強制
        playerPointsDisplay.classList.add('points-updated');
      }
    }
  
    // マスター画面への移動
    goToMasterBtn.addEventListener('click', () => {
      showScreen('master-panel');
      updatePlayersList(); // プレイヤーリストを更新
      updateAnswersList(); // 解答状況を更新
      
      // 定期的にプレイヤーリストと解答状況を更新
      setInterval(() => {
        updatePlayersList();
        updateAnswersList();
      }, 5000);
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
                joinedAt: null,
                answered: false,
                answerCorrect: false,
                points: POINTS_CONFIG.initial
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
              
              // プレイヤー名とポイント
              const nameSpan = document.createElement('span');
              nameSpan.className = 'player-name';
              nameSpan.textContent = player.name;
              
              const pointsSpan = document.createElement('span');
              pointsSpan.className = 'player-points-list';
              pointsSpan.textContent = `${player.points || 0}pt`;
              
              listItem.appendChild(nameSpan);
              listItem.appendChild(pointsSpan);
              
              // 解答済みのプレイヤーにはステータスを表示
              if (player.answered) {
                const statusSpan = document.createElement('span');
                statusSpan.className = 'player-status';
                
                if (player.answerCorrect) {
                  statusSpan.textContent = '正解';
                  statusSpan.classList.add('correct');
                } else {
                  statusSpan.textContent = '不正解';
                  statusSpan.classList.add('incorrect');
                }
                
                listItem.appendChild(statusSpan);
              }
              
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
    
    // 解答状況を更新する関数
    function updateAnswersList() {
      // 解答を取得し、回答時間でソート
      answersCollection.orderBy('answeredAt', 'desc').get()
        .then(snapshot => {
          // リストをクリア
          playerAnswersList.innerHTML = '';
          
          if (!snapshot.empty) {
            // プレイヤーごとの最新の正解情報を管理
            const correctPlayers = new Set();
            
            // 解答一覧を表示
            snapshot.forEach(doc => {
              const answer = doc.data();
              
              // プレイヤーが既に正解済みで、この解答が不正解の場合はスキップできる（表示オプション）
              // ここでは全ての解答を表示する
              
              const listItem = document.createElement('li');
              
              if (answer.isCorrect) {
                listItem.classList.add('correct');
                correctPlayers.add(answer.playerId); // 正解したプレイヤーを記録
              } else {
                listItem.classList.add('incorrect');
              }
              
              // プレイヤー名と解答内容
              const playerNameSpan = document.createElement('span');
              playerNameSpan.classList.add('player-name');
              playerNameSpan.textContent = `${answer.playerName}: "${answer.answer}"`;
              
              // 解答時間
              const answerTimeSpan = document.createElement('span');
              answerTimeSpan.classList.add('answer-time');
              
              if (answer.answerTime !== undefined) {
                // タイムスタンプをフォーマット
                const date = answer.answeredAt ? new Date(answer.answeredAt.toDate()) : new Date();
                const timeString = date.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
                
                answerTimeSpan.textContent = `${timeString} (${answer.answerTime.toFixed(2)}秒)`;
              } else {
                answerTimeSpan.textContent = '記録なし';
              }
              
              listItem.appendChild(playerNameSpan);
              listItem.appendChild(answerTimeSpan);
              playerAnswersList.appendChild(listItem);
            });
            
            // 正解者がいない場合のメッセージ（オプション）
            if (correctPlayers.size === 0) {
              const correctInfoItem = document.createElement('li');
              correctInfoItem.style.background = '#f8f9fa';
              correctInfoItem.style.fontStyle = 'italic';
              correctInfoItem.style.padding = '8px 15px';
              correctInfoItem.textContent = 'まだ正解者はいません';
              playerAnswersList.prepend(correctInfoItem);
            }
          } else {
            // 解答がない場合
            const listItem = document.createElement('li');
            listItem.textContent = 'まだ解答はありません';
            listItem.style.fontStyle = 'italic';
            listItem.style.color = '#666';
            playerAnswersList.appendChild(listItem);
          }
        })
        .catch(error => {
          console.error('解答リスト取得エラー:', error);
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
    
    // 解答送信処理
    submitAnswerBtn.addEventListener('click', () => {
      console.log('解答ボタンがクリックされました');
      submitAnswer();
    });
  
    // Enter キーで解答送信
    playerAnswer.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('Enterキーが押されました');
        submitAnswer();
      }
    });
  
    // 解答送信の共通処理
    function submitAnswer() {
      console.log('submitAnswer関数が呼び出されました');
      console.log('現在の状態:', {
        gameStartTime,
        currentPlayerAnswered: currentPlayer.answered,
        answer: playerAnswer.value,
        answerSectionVisible: !answerSection.classList.contains('hidden'),
        submitButtonDisabled: submitAnswerBtn.disabled,
        inputDisabled: playerAnswer.disabled,
        currentPlayerId: currentPlayer.id,
        currentPoints: currentPlayer.points
      });
      
      // ゲームが開始されていない場合は何もしない
      if (!gameStartTime) {
        console.log('ゲーム開始時刻が設定されていないため、解答処理をスキップします');
        return;
      }
      
      const answer = playerAnswer.value.trim().toLowerCase(); // 小文字に変換して比較
      if (!answer) {
        console.log('解答が空のため、処理をスキップします');
        return;
      }
      
      console.log(`解答内容: "${answer}"`);
      console.log(`正解内容: "${CORRECT_ANSWER.toLowerCase()}"`);
      
      // 解答時間を計算（秒単位）
      const now = Date.now();
      const answerTime = (now - gameStartTime) / 1000;
      console.log(`解答時間計算: (${now} - ${gameStartTime}) / 1000 = ${answerTime}秒`);
      
      // 正解かどうかをチェック
      const isCorrect = answer === CORRECT_ANSWER.toLowerCase();
      console.log(`正解判定: ${isCorrect ? '正解' : '不正解'} (${answer} === ${CORRECT_ANSWER.toLowerCase()} は ${isCorrect})`);
      
      // プレイヤー情報を更新
      if (isCorrect) {
        // 正解の場合のみ、解答済みフラグを立てる
        currentPlayer.answered = true;
        currentPlayer.answerCorrect = true;
        
        // 正解時にポイントを加算
        const newPoints = currentPlayer.points + POINTS_CONFIG.correctAnswer;
        currentPlayer.points = newPoints;
        console.log(`正解ポイント付与: ${POINTS_CONFIG.correctAnswer}ポイント、合計: ${newPoints}ポイント`);
        
        // ポイント表示を更新
        updatePointsDisplay(newPoints);
        
        // Firestoreのプレイヤー情報を更新
        playersCollection.doc(currentPlayer.id).update({
          answered: true,
          answerCorrect: true,
          points: newPoints,
          lastAnswerTime: answerTime
        })
        .then(() => {
          console.log('プレイヤー情報の更新に成功しました');
        })
        .catch(error => {
          console.error('プレイヤー情報の更新に失敗:', error);
        });
      } else {
        // 不正解の場合は解答済みフラグを立てない（再挑戦可能）
        // ただし、最新の解答状況はFirestoreに記録する
        playersCollection.doc(currentPlayer.id).update({
          lastAnswer: answer,
          lastAnswerTime: answerTime,
          lastAnsweredAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          console.log('プレイヤーの解答履歴を更新しました');
        })
        .catch(error => {
          console.error('プレイヤーの解答履歴の更新に失敗:', error);
        });
      }
      
      // 解答情報をFirestoreに保存（履歴として全解答を記録）
      // 毎回新しいドキュメントIDで保存する
      const answerDocId = `${currentPlayer.id}_${Date.now()}`;
      const answerData = {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        answer: answer,
        isCorrect: isCorrect,
        answerTime: answerTime,
        answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        pointsEarned: isCorrect ? POINTS_CONFIG.correctAnswer : 0,
        totalPoints: isCorrect ? currentPlayer.points : currentPlayer.points
      };
      
      answersCollection.doc(answerDocId).set(answerData)
        .then(() => {
          console.log('解答を記録しました', answerData);
          
          // 解答結果を表示
          answerResult.textContent = isCorrect 
            ? `正解です！ +${POINTS_CONFIG.correctAnswer}ポイント獲得` 
            : '残念、不正解です。もう一度試してください。';
          answerResult.className = isCorrect ? 'correct' : 'incorrect';
          
          // 解答時間を表示（正解の場合のみ）
          if (isCorrect) {
            answerTime.textContent = `解答時間: ${answerTime.toFixed(2)}秒`;
          } else {
            answerTime.textContent = '';
          }
          
          // 正解の場合のみ入力欄を無効化、不正解の場合はクリアして再度入力可能に
          if (isCorrect) {
            setAnswerInputState(false); // 入力無効化
            
            // ポイント情報をローカルストレージに保存
            const savedPlayer = loadFromLocalStorage('currentPlayer') || {};
            savedPlayer.points = currentPlayer.points;
            saveToLocalStorage('currentPlayer', savedPlayer);
          } else {
            playerAnswer.value = '';  // 入力欄をクリア
            playerAnswer.focus();     // フォーカスを再設定
          }
        })
        .catch(error => {
          console.error('解答の記録に失敗:', error);
          alert('解答の送信に失敗しました。もう一度お試しください。');
        });
    }
  
    // マスター側：ゲーム開始
    startGameBtn.addEventListener('click', () => {
        console.log("Starting game...");
        if (statusMessage) statusMessage.textContent = "ゲーム開始中...";
        
        // 画像パスを設定 - フルパスを使用
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const imagePath = baseUrl + 'puzzle.png';
        console.log("Image path:", imagePath);
        
        // 現在時刻（ゲーム開始時刻）
        const startTime = Date.now();
        
        // 解答コレクションをクリア
        deleteAllAnswers()
          .then(() => {
            console.log('すべての解答をクリアしました');
            
            // 全プレイヤーの解答状態をリセット
            return resetAllPlayerAnswers();
          })
          .then(() => {
            console.log('全プレイヤーの解答状態をリセットしました');
            
            // ゲームの状態オブジェクト
            const gameState = createGameState(true, imagePath, startTime);
            
            // ローカルストレージにも状態を保存（フォールバック用）
            saveToLocalStorage('gameState', {
              ...gameState,
              timestamp: Date.now()
            });
            
            // ゲーム状態を更新（gameStateドキュメントに保存）
            return gameStateCollection.doc('current').set(gameState);
          })
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
              updateGameDisplay({
                gameStarted: true,
                imagePath: imagePath,
                timestamp: Date.now(),
                correctAnswer: CORRECT_ANSWER,
                startTime: startTime,
                points: POINTS_CONFIG.initial
              });
              
              // 解答リストを更新
              updateAnswersList();
          })
          .catch(error => {
              console.error("Error updating game state:", error);
              if (statusMessage) statusMessage.textContent = "Firestore更新エラー (ローカルモードで動作中): " + error.message;
          });
    });
    
    // すべての解答を削除する関数
    function deleteAllAnswers() {
      return answersCollection.get()
        .then(snapshot => {
          const batch = db.batch();
          
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          return batch.commit();
        });
    }
    
    // すべてのプレイヤーの解答状態をリセットする関数
    function resetAllPlayerAnswers() {
      return playersCollection.get()
        .then(snapshot => {
          const batch = db.batch();
          
          snapshot.forEach(doc => {
            batch.update(doc.ref, {
              answered: false,
              answerCorrect: false
            });
          });
          
          return batch.commit();
        });
    }
  
    // マスター側：リセット
    resetGameBtn.addEventListener('click', () => {
        console.log("Resetting game...");
        if (statusMessage) statusMessage.textContent = "リセット中...";
        
        // 解答コレクションをクリア
        deleteAllAnswers()
          .then(() => {
            console.log('すべての解答をクリアしました');
            
            // 全プレイヤーの解答状態をリセット
            return resetAllPlayerAnswers();
          })
          .then(() => {
            console.log('全プレイヤーの解答状態をリセットしました');
            
            // ゲームの状態オブジェクト
            const gameState = createGameState(false);
            
            // ローカルストレージの状態もリセット
            saveToLocalStorage('gameState', {
              ...gameState,
              timestamp: Date.now()
            });
            
            // ゲーム状態をリセット
            return gameStateCollection.doc('current').set(gameState);
          })
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
              updateGameDisplay(createGameState(false));
              
              // 解答リストを更新
              updateAnswersList();
          })
          .catch(error => {
              console.error("Error resetting game state:", error);
              if (statusMessage) statusMessage.textContent = "Firestore リセットエラー (ローカルモードで動作中): " + error.message;
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
            updateGameDisplay(createGameState(false));
          }
        }, (error) => {
          console.error("Error getting game state:", error);
          fbConnectionError = true;
          
          // Firestoreからの取得に失敗した場合、ローカルストレージを使用
          const localGameState = loadFromLocalStorage('gameState');
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
      
      console.log('updateGameDisplay:', gameState);
      
      // プレイヤー表示の同期（ポイントなど）
      syncPlayerDisplay();
      
      if (gameState && gameState.gameStarted) {
          // ゲームが開始されたら画像を表示
          contentP.textContent = 'ゲームが開始されました！';
          contentP.classList.add('game-started');
          
          // 解答欄を表示
          if (answerSection) {
            console.log('解答欄を表示します');
            answerSection.classList.remove('hidden');
            
            // プレイヤーが既に正解している場合のみ入力欄を無効化
            if (currentPlayer.answered && currentPlayer.answerCorrect) {
              console.log('プレイヤーは既に正解しています。入力欄を無効化します');
              setAnswerInputState(false);
              
              // 最新の解答時間を取得して表示
              playersCollection.doc(currentPlayer.id).get()
                .then(doc => {
                  if (doc.exists) {
                    const playerData = doc.data();
                    
                    // 解答結果表示
                    answerResult.textContent = `正解です！ +${POINTS_CONFIG.correctAnswer}ポイント獲得`;
                    answerResult.className = 'correct';
                    
                    // 解答時間表示
                    if (playerData.lastAnswerTime) {
                      answerTime.textContent = `解答時間: ${playerData.lastAnswerTime.toFixed(2)}秒`;
                    }
                    
                    // ポイント情報を同期
                    if (playerData.points !== undefined && playerData.points !== currentPlayer.points) {
                      currentPlayer.points = playerData.points;
                      // syncPlayerDisplay()内で行うのでここでは不要
                      syncPlayerDisplay();
                    }
                  }
                })
                .catch(console.error);
            } else {
              console.log('プレイヤーはまだ正解していません。入力欄を有効化します');
              setAnswerInputState(true);
              
              // 以前の解答結果が残っていれば表示（再接続時など）
              if (currentPlayer.id) {
                playersCollection.doc(currentPlayer.id).get()
                  .then(doc => {
                    if (doc.exists) {
                      const playerData = doc.data();
                      
                      // 解答結果表示を設定
                      if (playerData.lastAnswer && !playerData.answerCorrect) {
                        // 不正解の場合
                        answerResult.textContent = '残念、不正解です。もう一度試してください。';
                        answerResult.className = 'incorrect';
                      } else if (playerData.answerCorrect) {
                        // 正解の場合
                        answerResult.textContent = `正解です！ +${POINTS_CONFIG.correctAnswer}ポイント獲得`;
                        answerResult.className = 'correct';
                      } else {
                        // 解答前
                        resetAnswerInput();
                      }
                      
                      // ポイント情報を同期
                      if (playerData.points !== undefined && playerData.points !== currentPlayer.points) {
                        currentPlayer.points = playerData.points;
                        syncPlayerDisplay();
                      }
                    }
                  })
                  .catch(console.error);
              } else {
                // 解答結果表示をクリア
                resetAnswerInput();
              }
            }
          } else {
            console.log('解答欄要素が見つかりません');
          }
          
          // ゲーム開始時刻を記録（解答時間計算用）
          if (gameState.startTime) {
            console.log(`ゲーム開始時刻をFirestoreから取得: ${gameState.startTime}`);
            gameStartTime = gameState.startTime;
          } else if (!gameStartTime) {
            console.log('ゲーム開始時刻を現在時刻で設定します');
            gameStartTime = Date.now();
          }
          
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
          
          // 解答欄を非表示
          if (answerSection) {
            console.log('解答欄を非表示にします');
            answerSection.classList.add('hidden');
          }
          
          // 解答関連の状態をリセット
          resetAnswerInput();
          
          // ゲーム開始時刻をリセット
          console.log('ゲーム開始時刻をリセットします');
          gameStartTime = null;
          
          // 現在のプレイヤーの解答状態をリセット（プレイヤーの場合）
          if (currentPlayer.id) {
            // ローカルの状態をリセット
            currentPlayer.answered = false;
            currentPlayer.answerCorrect = false;
            
            // Firestoreのプレイヤー情報も更新
            playersCollection.doc(currentPlayer.id).update({
              answered: false,
              answerCorrect: false,
              lastAnswer: null,
              lastAnswerTime: null,
              lastAnsweredAt: null
            }).catch(console.error);
          }
          
          console.log("Waiting for game to start");
      }
    }
  
    // 前回のプレイヤー情報があれば復元
    const savedPlayer = loadFromLocalStorage('currentPlayer');
    if (savedPlayer) {
      try {
        if (savedPlayer.name) {
          playerNameInput.value = savedPlayer.name;
        }
        
        // ポイント情報が保存されていれば復元
        if (savedPlayer.id && savedPlayer.points !== undefined) {
          // サーバーから最新のプレイヤー情報を取得
          playersCollection.doc(savedPlayer.id).get()
            .then(doc => {
              if (doc.exists) {
                const serverPlayerData = doc.data();
                // サーバー上のデータがある場合はそちらを優先
                currentPlayer = {
                  ...currentPlayer,
                  ...serverPlayerData
                };
                
                // ポイント表示を更新
                syncPlayerDisplay();
              } else {
                // サーバー上にデータがなければローカルデータを使用
                currentPlayer.points = savedPlayer.points;
              }
            })
            .catch(error => {
              console.error('プレイヤー情報の取得に失敗:', error);
              // エラー時はローカルデータを使用
              currentPlayer.points = savedPlayer.points;
            });
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