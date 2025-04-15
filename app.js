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
    
    // ステージ設定
    const STAGES = {
      stage1: {
        id: 'stage1',
        name: 'ステージ1',
        correctAnswer: 'りんご',
        imagePath: 'puzzle.png',
        pointReward: 10
      },
      stage2: {
        id: 'stage2',
        name: 'ステージ2',
        correctAnswer: 'ばなな',
        imagePath: 'puzzle2.png',
        pointReward: 20
      },
      stage3: {
        id: 'stage3',
        name: 'ステージ3',
        correctAnswer: 'みかん',
        imagePath: 'puzzle3.png',
        pointReward: 30
      }
    };
    
    // 現在選択中のステージ
    let currentStage = STAGES.stage1;
    
    // ゲームの正解（ステージによって変わる）
    let CORRECT_ANSWER = currentStage.correctAnswer;
    
    // ポイント設定
    const POINTS_CONFIG = {
      initial: 0,
      correctAnswer: 10,
      bonusPerSecond: 0.1
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
    function createGameState(started, stage = currentStage, imagePath = '', startTime = null) {
      // ステージが文字列の場合はステージIDとして扱う
      const selectedStage = typeof stage === 'string' ? STAGES[stage] : stage;
      
      // デフォルト画像パスがない場合はステージの画像を使用
      const actualImagePath = imagePath || (selectedStage ? selectedStage.imagePath : '');
      
      return {
        gameStarted: started,
        stageId: selectedStage ? selectedStage.id : null,
        stageName: selectedStage ? selectedStage.name : null,
        correctAnswer: selectedStage ? selectedStage.correctAnswer : CORRECT_ANSWER,
        pointReward: selectedStage ? selectedStage.pointReward : POINTS_CONFIG.correctAnswer,
        imagePath: actualImagePath,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        startTime,
        endTime: null,
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
    const playerAnswer = document.getElementById('answer-input');
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
      
      // 正解かどうかをチェック（ゲームステートから取得した最新の正解で判定）
      const isCorrect = answer === CORRECT_ANSWER.toLowerCase();
      console.log(`正解判定: ${isCorrect ? '正解' : '不正解'} (${answer} === ${CORRECT_ANSWER.toLowerCase()} は ${isCorrect})`);
      
      // プレイヤー情報を更新
      if (isCorrect) {
        // 正解の場合のみ、解答済みフラグを立てる
        currentPlayer.answered = true;
        currentPlayer.answerCorrect = true;
        
        // 正解時にステージのポイントを加算
        // ステージに設定されたポイント報酬を使用
        const pointReward = currentStage.pointReward || POINTS_CONFIG.correctAnswer;
        const newPoints = currentPlayer.points + pointReward;
        currentPlayer.points = newPoints;
        console.log(`正解ポイント付与: ${pointReward}ポイント、合計: ${newPoints}ポイント`);
        
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
      
      // 解答情報をFirestoreに保存
      const answerDocId = `${currentPlayer.id}_${Date.now()}`;
      const answerData = {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        answer: answer,
        isCorrect: isCorrect,
        answerTime: answerTime,
        answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        stageId: currentStage.id, // ステージIDを記録
        stageName: currentStage.name, // ステージ名を記録
        pointsEarned: isCorrect ? (currentStage.pointReward || POINTS_CONFIG.correctAnswer) : 0,
        totalPoints: isCorrect ? currentPlayer.points : currentPlayer.points
      };
      
      answersCollection.doc(answerDocId).set(answerData)
        .then(() => {
          console.log('解答を記録しました', answerData);
          
          // 解答結果を表示
          answerResult.textContent = isCorrect 
            ? `正解です！ +${currentStage.pointReward || POINTS_CONFIG.correctAnswer}ポイント獲得` 
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
    startGameBtn.addEventListener('click', async () => {
      try {
        const stageSelector = document.getElementById('stage-selector');
        const selectedStageId = stageSelector ? stageSelector.value : 'stage1';
        
        // 選択されたステージを設定
        currentStage = STAGES[selectedStageId];
        CORRECT_ANSWER = currentStage.correctAnswer;
        
        console.log('選択されたステージ:', currentStage.name);
        console.log('正解:', CORRECT_ANSWER);
        
        // ゲーム状態を更新
        const gameState = createGameState(
          true, 
          currentStage, 
          currentStage.imagePath, 
          firebase.firestore.FieldValue.serverTimestamp()
        );
        
        await gameStateCollection.doc('current').set(gameState);
        
        updateGameStatus('ゲームを開始しました！');
        updateGameDisplay(gameState);
      } catch (error) {
        console.error('ゲームの開始に失敗しました:', error);
        updateGameStatus('ゲームの開始に失敗しました。再度お試しください。');
      }
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
      const gameContainer = document.getElementById('game-container');
      const puzzleImage = document.getElementById('puzzle-image');
      const stageNameDisplay = document.getElementById('stage-name');
      
      if (gameContainer && gameState) {
        if (gameState.gameStarted) {
          gameContainer.classList.remove('hidden');
          
          if (puzzleImage && gameState.imagePath) {
            puzzleImage.src = gameState.imagePath;
            puzzleImage.alt = `${gameState.stageName}のパズル画像`;
          }
          
          if (stageNameDisplay && gameState.stageName) {
            stageNameDisplay.textContent = gameState.stageName;
          }
        } else {
          gameContainer.classList.add('hidden');
        }
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

// ゲーム開始関数
function startGame(selectedStageId) {
  if (!selectedStageId || !STAGES[selectedStageId]) {
    console.error('無効なステージID:', selectedStageId);
    return;
  }

  const stage = STAGES[selectedStageId];
  currentStage = stage;
  CORRECT_ANSWER = stage.correctAnswer;

  // ゲーム状態を作成して保存
  const newGameState = createGameState(true, stage, stage.imagePath, new Date().toISOString());
  
  // Firestoreにゲーム状態を保存
  gameStateCollection.doc('current').set(newGameState)
    .then(() => {
      console.log('ゲームが開始されました。ステージ:', stage.name);
      
      // マスター画面の場合、UIを更新
      if (isMasterScreen) {
        document.getElementById('end-game').removeAttribute('disabled');
        document.getElementById('start-game').setAttribute('disabled', 'true');
        
        // ステータスメッセージを更新
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
          statusMessage.textContent = `${stage.name}が開始されました。正解: ${stage.correctAnswer}`;
        }
      }
    })
    .catch(error => {
      console.error('ゲーム開始時のデータ保存エラー:', error);
    });
}

// ゲーム終了関数
function endGame() {
  if (!currentStage) {
    console.error('現在のステージが設定されていません。');
    return;
  }
  
  // 現在の時刻をエンドタイムとして設定
  const endTime = new Date().toISOString();
  
  // 既存のゲームステートを取得して更新
  gameStateCollection.doc('current').get()
    .then(doc => {
      if (doc.exists) {
        const currentState = doc.data();
        
        // 終了状態を設定
        currentState.gameStarted = false;
        currentState.endTime = endTime;
        
        // Firestoreに更新したゲーム状態を保存
        return gameStateCollection.doc('current').update(currentState);
      } else {
        console.error('現在のゲーム状態が見つかりません。');
        return null;
      }
    })
    .then(() => {
      if (isMasterScreen) {
        console.log('ゲームが終了しました。ステージ:', currentStage.name);
        
        // マスター画面のUI更新
        document.getElementById('end-game').setAttribute('disabled', 'true');
        document.getElementById('start-game').removeAttribute('disabled');
        
        // ステータスメッセージを更新
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
          statusMessage.textContent = `${currentStage.name}が終了しました。`;
        }
      }
    })
    .catch(error => {
      console.error('ゲーム終了時のデータ更新エラー:', error);
    });
}

// ゲームリセット関数
function resetGame() {
  // 初期状態のゲーム状態を作成
  const initialState = createGameState(false);
  
  // Firestoreにリセットされたゲーム状態を保存
  gameStateCollection.doc('current').set(initialState)
    .then(() => {
      console.log('ゲームがリセットされました。');
      
      // プレイヤー情報もリセット
      if (currentPlayer) {
        // プレイヤーの回答状態をリセット
        if (currentPlayer.id) {
          playersCollection.doc(currentPlayer.id).update({
            hasAnswered: false,
            isCorrect: false,
            answer: ''
          }).catch(e => console.error('プレイヤー情報リセットエラー:', e));
        }
        
        // 現在のプレイヤーオブジェクトを更新
        currentPlayer.hasAnswered = false;
        currentPlayer.isCorrect = false;
        currentPlayer.answer = '';
        saveToLocalStorage('currentPlayer', currentPlayer);
      }
      
      // マスター画面のUI更新
      if (isMasterScreen) {
        document.getElementById('end-game').setAttribute('disabled', 'true');
        document.getElementById('start-game').removeAttribute('disabled');
        
        // ステータスメッセージを更新
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
          statusMessage.textContent = 'ゲームがリセットされました。新しいステージを選択してください。';
        }
      }
    })
    .catch(error => {
      console.error('ゲームリセット時のデータ保存エラー:', error);
    });
}

// ドキュメントが読み込まれた後の初期化
document.addEventListener('DOMContentLoaded', function() {
  // マスター画面特有の初期化
  if (isMasterScreen) {
    // ステージ選択リスナーの設定
    const stageSelector = document.getElementById('stage-selector');
    if (stageSelector) {
      stageSelector.addEventListener('change', function() {
        const selectedStageId = this.value;
        console.log('ステージが選択されました:', STAGES[selectedStageId].name);
      });
    }
    
    // ゲーム開始ボタンのリスナー設定
    const startButton = document.getElementById('start-game');
    if (startButton) {
      startButton.addEventListener('click', function() {
        const stageSelector = document.getElementById('stage-selector');
        const selectedStageId = stageSelector.value;
        startGame(selectedStageId);
      });
    }
    
    // ゲーム終了ボタンのリスナー設定
    const endButton = document.getElementById('end-game');
    if (endButton) {
      endButton.addEventListener('click', function() {
        endGame();
      });
    }
    
    // ゲームリセットボタンのリスナー設定
    const resetButton = document.getElementById('reset-game');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        resetGame();
      });
    }
  }
  
  // プレイヤー情報の復元
  // ... 既存コード ...
  
  // ゲーム状態の監視を開始
  startGameStateListener();
});

// 回答送信処理
function submitAnswer(playerId, playerName, answer) {
  // 現在のゲーム状態を取得
  gameStateCollection.doc('current').get().then(async (doc) => {
    if (doc.exists) {
      const gameState = doc.data();
      
      // ゲームが開始されている場合のみ処理
      if (gameState.gameStarted) {
        // 正解かどうかを確認（ステージの正解に基づいて判定）
        const isCorrect = answer === gameState.correctAnswer;
        
        if (isCorrect) {
          // 正解の場合の処理
          const endTime = firebase.firestore.FieldValue.serverTimestamp();
          
          // プレイヤーのポイントを更新
          await playersCollection.doc(playerId).update({
            points: firebase.firestore.FieldValue.increment(gameState.pointReward),
            lastUpdated: endTime,
            answerCorrect: true,
            lastAnswer: answer
          });
          
          // ゲーム状態を更新（ゲーム終了）
          await gameStateCollection.doc('current').update({
            gameStarted: false,
            endTime: endTime,
            winner: {
              id: playerId,
              name: playerName
            }
          });
          
          updateGameStatus(`${playerName}さんが正解しました！${gameState.pointReward}ポイント獲得！`);
        } else {
          // 不正解の場合の処理
          await playersCollection.doc(playerId).update({
            lastAnswer: answer,
            answerCorrect: false,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          });
          updateGameStatus(`${playerName}さんの回答「${answer}」は不正解です。`);
        }
      } else {
        updateGameStatus('ゲームはまだ開始されていません。');
      }
    }
  }).catch((error) => {
    console.error('回答の処理中にエラーが発生しました:', error);
    updateGameStatus('回答の処理中にエラーが発生しました。');
  });
}

// プレイヤー側の回答ボタンイベントリスナー
if (submitAnswerBtn) {
  submitAnswerBtn.addEventListener('click', () => {
    const answerInput = document.getElementById('answer-input');
    if (answerInput && currentPlayer.id) {
      const answer = answerInput.value.trim();
      if (answer) {
        submitAnswer(currentPlayer.id, currentPlayer.name, answer);
        answerInput.value = '';
      } else {
        updateGameStatus('回答を入力してください。');
      }
    }
  });
} 