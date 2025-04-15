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
    const readyStateCollection = db.collection('readyState');
    
    // ステージ設定
    const STAGES = {
      stage1: {
        id: 'stage1',
        name: 'ステージ1',
        correctAnswer: 'りんご',
        imagePath: 'puzzle.png',
        pointReward: 10,
        hint: 'フルーツの王様とも呼ばれています。赤い色が特徴的です。',
        hintCost: 5  // ヒントを見るのに必要なポイント
      },
      stage2: {
        id: 'stage2',
        name: 'ステージ2',
        correctAnswer: 'ばなな',
        imagePath: 'puzzle2.png',
        pointReward: 20,
        hint: '黄色い曲がった形が特徴的なフルーツです。猿も大好きです。',
        hintCost: 7  // ヒントを見るのに必要なポイント
      },
      stage3: {
        id: 'stage3',
        name: 'ステージ3',
        correctAnswer: 'みかん',
        imagePath: 'puzzle3.png',
        pointReward: 30,
        hint: '冬になると食べたくなる、オレンジ色の柑橘系フルーツです。',
        hintCost: 10  // ヒントを見るのに必要なポイント
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
      return {
        gameStarted: started,
        gamePreparing: false,
        stageId: stage.id,
        stageName: stage.name,
        correctAnswer: stage.correctAnswer,
        imagePath: imagePath || stage.imagePath,
        pointReward: stage.pointReward,
        hint: stage.hint,
        hintCost: stage.hintCost,
        startTime: startTime,
        countdown: false,
        countdownValue: null,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };
    }
    
    // ユーティリティ関数 - UI管理 //
    
    // 解答入力状態の設定
    function setAnswerInputState(enabled) {
      if (playerAnswer && submitAnswerBtn) {
        playerAnswer.disabled = !enabled;
        submitAnswerBtn.disabled = !enabled;
        // 無効化する場合でも、入力内容はクリアしない
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
    const showResultsBtn = document.getElementById('show-results'); // 結果発表ボタン
    const resetGameBtn = document.getElementById('reset-game');
    const imageContainer = document.getElementById('image-container');
    const statusMessage = document.getElementById('status-message') || document.createElement('div'); // ステータスメッセージ要素がない場合の対策
    const connectedPlayersList = document.getElementById('connected-players');
    const backToRegistrationBtns = document.querySelectorAll('#back-to-registration');
    
    // カウントダウン関連の要素
    const countdownOverlay = document.querySelector('.countdown-overlay');
    const countdownNumber = document.querySelector('.countdown-number');
    
    // 解答関連の要素
    const answerSection = document.getElementById('answer-section');
    const playerAnswer = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const answerResult = document.getElementById('answer-result');
    const answerTime = document.getElementById('answer-time');
    const playerAnswersList = document.getElementById('player-answers');
    
    // ヒント関連の要素
    const hintSection = document.getElementById('hint-section');
    const buyHintBtn = document.getElementById('buy-hint-btn');
    const hintContent = document.getElementById('hint-content');
    
    // ランキング関連の要素
    const resultsRanking = document.getElementById('results-ranking');
    const rankingList = document.getElementById('ranking-list');
  
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
      points: POINTS_CONFIG.initial,
      stageId: null // 現在のステージIDを追跡
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
  
    // プレイヤー名からプレイヤーIDを生成（名前に基づいた一貫したID）
    function generatePlayerIdFromName(playerName) {
      // シンプルなハッシュ関数
      let hash = 0;
      for (let i = 0; i < playerName.length; i++) {
        const char = playerName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit整数に変換
      }
      // 負の値を避けるために絶対値を取り、プレフィックスを追加
      return `player_${Math.abs(hash)}`;
    }
  
    // プレイヤー登録処理
    registerPlayerBtn.addEventListener('click', () => {
      const playerName = playerNameInput.value.trim();
      
      if (!playerName) {
        alert('プレイヤー名を入力してください');
        return;
      }
      
      // プレイヤー名からIDを生成（同じ名前なら同じIDになる）
      const playerId = generatePlayerIdFromName(playerName);
      
      // まず既存のプレイヤー情報を取得
      playersCollection.doc(playerId).get()
        .then(doc => {
          if (doc.exists) {
            // 既存プレイヤーの場合は情報を復元
            console.log('既存プレイヤーの情報を復元:', playerId);
            const existingPlayerData = doc.data();
            
            // 現在のプレイヤー情報を更新
            currentPlayer = {
              ...existingPlayerData,
              isActive: true,
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // 復元した情報をFirestoreに書き戻す（活動状態を更新）
            return playersCollection.doc(playerId).update({
              isActive: true,
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // 新規プレイヤーの場合は新しく作成
            console.log('新規プレイヤーを作成:', playerId);
            
            // プレイヤー情報を作成
            currentPlayer = {
              id: playerId,
              name: playerName,
              isActive: true,
              joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              answered: false,
              answerCorrect: false,
              points: POINTS_CONFIG.initial,
              stageId: null // 現在のステージIDを追跡
            };
            
            // Firestoreに新規プレイヤー情報を保存
            return playersCollection.doc(playerId).set(currentPlayer);
          }
        })
        .then(() => {
          console.log('プレイヤー登録/復元成功:', playerId);
          
          // プレイヤー表示を同期（名前とポイント）
          syncPlayerDisplay();
          
          // プレイヤー画面に遷移
          showScreen('player-panel');
          
          // ローカルストレージにプレイヤー情報を保存
          saveToLocalStorage('currentPlayer', {
            id: playerId,
            name: playerName,
            points: currentPlayer.points || POINTS_CONFIG.initial
          });
          
          // ポイントのリアルタイムリスナーを開始
          startPlayerPointsListener();
        })
        .catch(error => {
          console.error('プレイヤー登録/復元エラー:', error);
          alert('プレイヤー登録に失敗しました。もう一度お試しください。');
        });
    });
  
    // ポイント表示を更新する関数
    function updatePointsDisplay(points, isAnimation = false) {
      if (playerPointsDisplay) {
        if (isAnimation && currentPlayer.oldPoints !== undefined) {
          // アニメーションでポイントを徐々に増やす
          const startPoints = currentPlayer.oldPoints;
          const endPoints = points;
          const duration = 2000; // 2秒間
          const startTime = performance.now();
          
          // ポイント増加のアニメーション関数
          function animatePoints(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // イージング関数でスムーズに変化させる
            const easedProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
            
            // 現在のポイント値を計算
            const currentPoints = Math.floor(startPoints + (endPoints - startPoints) * easedProgress);
            playerPointsDisplay.textContent = currentPoints;
            
            // アニメーションが完了していなければ続行
            if (progress < 1) {
              requestAnimationFrame(animatePoints);
            } else {
              // 完了時に最終値を設定
              playerPointsDisplay.textContent = endPoints;
              
              // 完了時のアニメーション効果
              playerPointsDisplay.classList.remove('points-updated');
              void playerPointsDisplay.offsetWidth; // リフロー強制
              playerPointsDisplay.classList.add('points-updated');
            }
          }
          
          // アニメーション開始
          requestAnimationFrame(animatePoints);
        } else {
          // 通常の更新（アニメーションなし）
          playerPointsDisplay.textContent = points;
          
          // ポイント変動時のアニメーション効果
          playerPointsDisplay.classList.remove('points-updated');
          void playerPointsDisplay.offsetWidth; // リフロー強制
          playerPointsDisplay.classList.add('points-updated');
        }
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
        // 現在のプレイヤーを非アクティブに設定（削除はしない）
        if (currentPlayer.id) {
          playersCollection.doc(currentPlayer.id).update({
            isActive: false,
            lastLogout: firebase.firestore.FieldValue.serverTimestamp()
          })
            .then(() => {
              console.log('プレイヤーを非アクティブに設定しました');
              // 現在のプレイヤー情報をリセット（IDと名前は保持）
              const playerName = currentPlayer.name;
              const playerId = currentPlayer.id;
              currentPlayer = {
                id: playerId,
                name: playerName,
                isActive: false,
                joinedAt: null,
                answered: false,
                answerCorrect: false,
                points: POINTS_CONFIG.initial,
                stageId: null // 現在のステージIDをリセット
              };
            })
            .catch(error => {
              console.error('プレイヤー情報の更新に失敗:', error);
            });
        }
        
        // 登録画面に戻る
        showScreen('player-registration');
      });
    });
  
    // プレイヤーリストを更新する関数
    function updatePlayersList() {
      const playersList = document.getElementById('players-list');
      
      if (!connectedPlayers || playersList.classList.contains('hidden')) {
        return;
      }
      
      // プレイヤーリストをクリア
      playersList.innerHTML = '';
      let totalPlayers = 0;
      
      // ポイント順にプレイヤーをソート
      const sortedPlayers = Object.values(connectedPlayers).sort((a, b) => b.points - a.points);
      
      sortedPlayers.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.className = 'player-item';
        
        // プレイヤー名とポイントを表示
        let playerInfo = `${player.name}: ${player.points}点`;
        
        // プレイヤーのステータスを決定
        let statusText = '';
        let statusClass = '';
        
        // ゲーム中の場合
        if (gameState.status === 'in_progress') {
          // 正解したプレイヤー
          if (gameState.correctPlayers && gameState.correctPlayers[player.id]) {
            statusText = '正解';
            statusClass = 'correct';
          } 
          // 不正解のプレイヤー（回答履歴あり）
          else if (player.answerHistory && player.answerHistory.length > 0) {
            const lastAnswer = player.answerHistory[player.answerHistory.length - 1];
            if (lastAnswer.stageId === gameState.stageId && !lastAnswer.correct) {
              statusText = '不正解';
              statusClass = 'incorrect';
            } else {
              statusText = '回答待ち';
            }
          } 
          // ロード完了したプレイヤー
          else if (player.loaded) {
            statusText = 'ロード完了';
            statusClass = 'loaded';
          }
          // その他のプレイヤー
          else {
            statusText = 'ロード中...';
          }
        } 
        // ゲーム準備モードの場合
        else if (gameState.status === 'preparation') {
          if (player.ready) {
            statusText = '準備完了';
            statusClass = 'ready';
          } else if (player.loaded) {
            statusText = 'ロード完了';
            statusClass = 'loaded';
          } else {
            statusText = 'ロード中...';
          }
        }
        // ゲーム開始前の場合
        else {
          if (player.loaded) {
            statusText = 'ロード完了';
            statusClass = 'loaded';
          } else {
            statusText = 'ロード中...';
          }
        }
        
        // ステータスがある場合に表示
        if (statusText) {
          playerInfo += `<span class="player-status ${statusClass}">${statusText}</span>`;
        }
        
        playerItem.innerHTML = playerInfo;
        playersList.appendChild(playerItem);
        totalPlayers++;
      });
      
      // プレイヤーがいない場合のメッセージ
      if (totalPlayers === 0) {
        const noPlayersItem = document.createElement('li');
        noPlayersItem.textContent = '接続中のプレイヤーはいません';
        playersList.appendChild(noPlayersItem);
      }
      
      // 接続中のプレイヤー数を更新
      const playersCount = document.getElementById('players-count');
      if (playersCount) {
        playersCount.textContent = totalPlayers;
      }
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
      const answerInput = document.getElementById('answer-input');
      // 既に正解済みの場合は何もしない
      if (currentPlayer.answerCorrect) {
        console.log('このプレイヤーは既に正解済みです');
        updateGameStatus('すでに正解済みです。次のステージをお待ちください。');
        return;
      }
      
      if (answerInput && currentPlayer.id) {
        const answer = answerInput.value.trim();
        if (answer) {
          submitPlayerAnswer(currentPlayer.id, currentPlayer.name, answer);
        } else {
          updateGameStatus('回答を入力してください。');
        }
      }
    });
  
    // Enter キーで解答送信
    playerAnswer.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('Enterキーが押されました');
        // 既に正解済みの場合は何もしない
        if (currentPlayer.answerCorrect) {
          console.log('このプレイヤーは既に正解済みです');
          updateGameStatus('すでに正解済みです。次のステージをお待ちください。');
          return;
        }
        
        const answer = playerAnswer.value.trim();
        if (answer) {
          submitPlayerAnswer(currentPlayer.id, currentPlayer.name, answer);
        } else {
          updateGameStatus('回答を入力してください。');
        }
      }
    });
  
    // 回答送信処理（playerId, playerName, answerを受け取るバージョン）
    function submitPlayerAnswer(playerId, playerName, answer) {
      if (!playerId || !playerName || !answer) {
        console.error('submitPlayerAnswer: 引数が不足しています', {playerId, playerName, answer});
        return;
      }
      
      console.log(`プレイヤー ${playerName} が「${answer}」と回答しました`);
      
      // 現在のゲーム状態を取得
      gameStateCollection.doc('current').get().then(async (doc) => {
        if (doc.exists) {
          const gameState = doc.data();
          
          // ゲームが開始されている場合のみ処理
          if (gameState.gameStarted) {
            // 正解かどうかを確認（ステージの正解に基づいて判定）
            const isCorrect = answer.toLowerCase() === gameState.correctAnswer.toLowerCase();
            console.log(`回答チェック: ${answer} == ${gameState.correctAnswer} => ${isCorrect}`);
            
            // 解答時間を計算（秒単位）
            let answerTimeValue = null;
            if (gameStartTime) {
              const now = Date.now();
              answerTimeValue = (now - gameStartTime) / 1000;
              console.log(`解答時間: ${answerTimeValue}秒`);
            }
            
            // 解答情報をFirestoreに保存
            const answerDocId = `${playerId}_${Date.now()}`;
            const answerData = {
              playerId: playerId,
              playerName: playerName,
              answer: answer,
              isCorrect: isCorrect,
              answerTime: answerTimeValue,
              answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
              stageId: gameState.stageId || null,
              stageName: gameState.stageName || null,
              pointsEarned: isCorrect ? (gameState.pointReward || 0) : 0
            };
            
            // 回答をFirestoreに記録
            await answersCollection.doc(answerDocId).set(answerData);
            console.log('回答をFirestoreに記録しました', answerData);
            
            if (isCorrect) {
              // 正解の場合の処理
              const endTime = firebase.firestore.FieldValue.serverTimestamp();
              
              // プレイヤー情報を正解状態に更新
              currentPlayer.answered = true;
              currentPlayer.answerCorrect = true;
              // 現在のステージIDを記録
              currentPlayer.stageId = gameState.stageId || null;
              
              // 正解時にステージのポイントを加算
              const pointReward = gameState.pointReward || 0;
              currentPlayer.points += pointReward;
              
              // プレイヤー情報更新
              await playersCollection.doc(playerId).update({
                points: currentPlayer.points,
                answered: true,
                answerCorrect: true,
                lastAnswerTime: answerTimeValue,
                lastPointReward: pointReward,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                stageId: gameState.stageId
              });
              
              // 正解者情報をゲーム状態に追加（ゲームは終了しない）
              await gameStateCollection.doc('current').update({
                // gameStarted: false,  // ゲームを終了しないように変更
                // endTime: endTime,    // 終了時間も設定しない
                lastCorrectAnswer: {
                  id: playerId,
                  name: playerName,
                  answer: answer,
                  answerTime: answerTimeValue,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }
              });
              
              // ポイント表示を更新
              updatePointsDisplay(currentPlayer.points);
              
              // 解答結果を表示
              answerResult.textContent = `正解！！ +${pointReward}ポイント獲得`;
              answerResult.className = 'correct';
              
              // 解答時間を表示
              if (answerTimeValue !== null && answerTime) {
                answerTime.textContent = `解答時間: ${answerTimeValue.toFixed(2)}秒`;
              }
              
              // 正解の場合は入力欄を無効化（次のステージ開始時に有効化される）
              // ただし入力されたテキストはクリアしない
              if (playerAnswer && submitAnswerBtn) {
                playerAnswer.disabled = true;
                submitAnswerBtn.disabled = true;
              }
              console.log('解答入力を無効化しました - プレイヤーが正解（解答テキストは保持）');
              
              // ポイント情報をローカルストレージに保存
              const savedPlayer = loadFromLocalStorage('currentPlayer') || {};
              savedPlayer.points = currentPlayer.points;
              saveToLocalStorage('currentPlayer', savedPlayer);
              
              updateGameStatus(`${playerName}さんが正解しました！${pointReward}ポイント獲得！`);
            } else {
              // 不正解の場合
              console.log(`不正解: "${answer}" (正解: "${gameState.correctAnswer}")`);
              
              // プレイヤー情報の更新
              await playersCollection.doc(playerId).update({
                answered: true,
                answerCorrect: false,
                lastAnswer: answer,
                lastAnswerTime: answerTimeValue,
                lastAnsweredAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                stageId: gameState.stageId
              });
              
              // 回答履歴として保存
              await answersCollection.doc(`${playerId}_${Date.now()}`).set({
                playerId: playerId,
                playerName: playerName,
                answer: answer,
                isCorrect: false,
                stageId: gameState.stageId,
                stageName: gameState.stageName,
                answerTime: answerTimeValue,
                answeredAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              
              // 解答結果を表示
              answerResult.textContent = `「${answer}」は不正解です。もう一度挑戦してください。`;
              answerResult.className = 'incorrect';
              
              // 不正解の場合は入力欄をクリアして再度入力可能に
              playerAnswer.value = '';
              playerAnswer.focus();
              setAnswerInputState(true);
              
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
  
    // マスター側：ゲーム開始
    startGameBtn.addEventListener('click', async () => {
      try {
        console.log("Starting game...");
        updateGameStatus("ゲーム開始中...");
        
        const stageSelector = document.getElementById('stage-selector');
        const selectedStageId = stageSelector ? stageSelector.value : 'stage1';
        
        // 選択されたステージを設定
        currentStage = STAGES[selectedStageId];
        CORRECT_ANSWER = currentStage.correctAnswer;
        
        console.log('選択されたステージ:', currentStage.name);
        console.log('正解:', CORRECT_ANSWER);
        
        // カウントダウン開始を示すフラグを設定
        const countdownState = {
          countdown: true,
          startTime: firebase.firestore.FieldValue.serverTimestamp(),
          countdownSeconds: 3 // 5秒から3秒にカウントダウン時間を短縮
        };
        
        // カウントダウンステータスをFirestoreに保存
        await gameStateCollection.doc('current').update({
          countdown: true,
          countdownStartTime: firebase.firestore.FieldValue.serverTimestamp(),
          countdownSeconds: 3, // 5秒から3秒に変更
          selectedStageId: selectedStageId,
          selectedStageName: currentStage.name
        });
        
        updateGameStatus(`カウントダウン開始...`);
        
        // カウントダウン終了後（4秒後）に本当のゲーム開始処理を実行
        setTimeout(async () => {
          // 解答コレクションをクリア
          await deleteAllAnswers();
          console.log('すべての解答をクリアしました');
          
          // 全プレイヤーの解答状態をリセット
          await resetAllPlayerAnswers();
          console.log('全プレイヤーの解答状態をリセットしました');
          
          // ゲーム状態を更新
          const gameState = createGameState(
            true, 
            currentStage, 
            currentStage.imagePath, 
            firebase.firestore.FieldValue.serverTimestamp()
          );
          
          // ローカルストレージにも状態を保存（フォールバック用）
          saveToLocalStorage('gameState', {
            ...gameState,
            timestamp: Date.now()
          });
          
          // Firestoreにゲーム状態を保存
          await gameStateCollection.doc('current').set(gameState);
          console.log("Game state updated successfully");
          
          updateGameStatus(`ゲームが開始されました！ステージ: ${currentStage.name}`);
          
          // 解答リストを更新
          updateAnswersList();
        }, 4000); // カウントダウン3秒 + 演出のためのバッファ1秒
        
      } catch (error) {
        console.error('ゲームの開始に失敗しました:', error);
        updateGameStatus('ゲームの開始に失敗しました: ' + error.message);
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
            
            // カウントダウン状態の処理
            if (gameState.countdown === true) {
              handleCountdown(gameState);
            } else {
              // 通常のゲーム状態更新
              updateGameDisplay(gameState);
            }
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
    
    // カウントダウン処理を行う関数
    function handleCountdown(gameState) {
      if (!countdownOverlay || !countdownNumber) return;
      
      console.log("カウントダウン状態を検出しました");
      const seconds = gameState.countdownSeconds || 3; // デフォルトを3秒に変更
      
      // カウントダウンオーバーレイを表示
      countdownOverlay.classList.add('active');
      
      // カウントダウン処理
      let count = seconds;
      countdownNumber.textContent = count;
      
      // 以前のタイマーがあればクリア
      if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
      }
      
      // カウントダウンを開始
      countdownOverlay.classList.add('counting');
      
      // 現在のカウント数をdata属性に設定（スタイル切り替え用）
      countdownOverlay.setAttribute('data-count', count);
      
      const countdownTimer = setInterval(() => {
        count--;
        
        // カウントダウン更新
        if (count > 0) {
          // 数字を更新してアニメーションをリセット
          countdownNumber.textContent = count;
          countdownOverlay.classList.remove('counting');
          
          // 現在のカウント数をdata属性に設定（スタイル切り替え用）
          countdownOverlay.setAttribute('data-count', count);
          
          void countdownOverlay.offsetWidth; // リフロー強制
          countdownOverlay.classList.add('counting');
          
          // カウントダウン効果音を再生（オプション）
          // new Audio('countdown-beep.mp3').play().catch(e => console.log('効果音再生エラー:', e));
        } else if (count === 0) {
          // GOの表示
          countdownNumber.textContent = "GO!";
          countdownOverlay.classList.remove('counting');
          countdownOverlay.classList.add('final');
          
          // GO効果音を再生（オプション）
          // new Audio('countdown-go.mp3').play().catch(e => console.log('効果音再生エラー:', e));
        } else {
          // カウントダウン終了
          clearInterval(countdownTimer);
          
          // オーバーレイを非表示
          countdownOverlay.classList.remove('counting', 'final');
          countdownOverlay.classList.add('complete');
          
          // 少し待ってから完全に非表示
          setTimeout(() => {
            countdownOverlay.classList.remove('active', 'complete');
            // data-count属性をリセット
            countdownOverlay.removeAttribute('data-count');
          }, 800); // アニメーション時間に合わせて調整
        }
      }, 1000);
      
      // タイマー参照を保存
      window.countdownTimer = countdownTimer;
    }
    
    // ゲーム表示の更新関数
    function updateGameDisplay(gameState) {
      if (!gameState) return;
      
      // ゲームが開始された時としていない時でスタイルを変更
      const gameContent = document.getElementById('game-content');
      const answerSection = document.getElementById('answer-section');
      
      // 状態変更を検知
      const isNewGame = currentPlayer.stageId !== gameState.stageId;
      
      // 画像パスの変更を検知
      const imageChanged = imageContainer && imageContainer.dataset.currentImage !== gameState.imagePath;
      
      // ゲームが開始された時
      if (gameState.gameStarted) {
        if (gameContent) {
          const statusText = `ゲームが開始されました: ${gameState.stageName}`;
          gameContent.querySelector('p') && (gameContent.querySelector('p').textContent = statusText);
          gameContent.querySelector('p') && gameContent.querySelector('p').classList.add('game-started');
        }
        
        // 解答欄を表示
        if (answerSection) {
          answerSection.classList.remove('hidden');
        }
        
        // 新しいゲームが始まった場合のみ、入力欄を有効化し、前回の解答結果をクリア
        if (isNewGame) {
          console.log('新しいステージを検出:', gameState.stageId);
          
          // 入力欄を有効化
          setAnswerInputState(true);
          console.log('解答入力を有効化しました - 新しいゲーム開始');
          
          // 前回の解答結果表示をクリア
          if (answerResult) {
            answerResult.textContent = '';
            answerResult.className = '';
          }
          if (answerTime) {
            answerTime.textContent = '';
          }
          
          // プレイヤーの解答状態をリセット
          if (currentPlayer) {
            currentPlayer.answered = false;
            currentPlayer.answerCorrect = false;
            // 現在のステージIDを記録
            currentPlayer.stageId = gameState.stageId;
          }
          
          // ランキング表示を非表示にする
          if (resultsRanking) {
            resultsRanking.classList.add('hidden');
          }
          
          // ヒントコンテンツをリセット
          if (hintContent) {
            hintContent.textContent = '';
            hintContent.classList.add('hidden');
          }
          
          // ヒントボタンをリセット
          if (buyHintBtn) {
            buyHintBtn.disabled = false;
            buyHintBtn.textContent = `ヒントを見る (${gameState.hintCost || 5}pt)`;
          }
          
          // ヒントセクションを表示
          if (hintSection) {
            hintSection.classList.remove('hidden');
          }
        } else {
          console.log('同じステージの更新を検出。解答結果表示を維持します。');
          
          // 既に正解している場合は入力欄を無効化したままにする
          if (currentPlayer && currentPlayer.answerCorrect) {
            if (playerAnswer && submitAnswerBtn) {
              playerAnswer.disabled = true;
              submitAnswerBtn.disabled = true;
            }
            console.log('解答入力は無効化されたままです - プレイヤーは既に正解済み');
          }
        }
      } else if (!gameState.gameStarted) {
        // ゲームが開始されていない時
        gameStartTime = null;
        console.log('ゲーム開始時刻をリセットしました');
        
        // 解答欄を非表示
        if (answerSection) {
          answerSection.classList.add('hidden');
        }
        
        if (gameContent) {
          const statusText = gameState.gamePreparing 
            ? `準備中: ${gameState.stageName}` 
            : 'マスターがゲームを開始するのを待っています...';
          gameContent.querySelector('p') && (gameContent.querySelector('p').textContent = statusText);
          gameContent.querySelector('p') && gameContent.querySelector('p').classList.remove('game-started');
        }
        
        // ヒントセクションを非表示
        if (hintSection) {
          hintSection.classList.add('hidden');
        }
      }
      
      // 準備モードの処理
      if (gameState.gamePreparing) {
        console.log('ゲーム準備モードが有効です');
        
        // プレイヤー画面: 準備セクションを表示
        if (preparationSection) {
          preparationSection.classList.remove('hidden');
          
          // 画像をプリロード (新しい画像の場合のみ)
          if (imageChanged) {
            prepareGameImages(gameState);
          }
        }
        
        // マスター画面: 準備ボタンの表示を更新
        if (prepareGameBtn) {
          prepareGameBtn.textContent = '準備中...';
          prepareGameBtn.classList.add('preparing');
          
          // 準備状況をリアルタイムで監視
          readyStateCollection.onSnapshot(snapshot => {
            const readyPlayers = [];
            
            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.isReady) {
                readyPlayers.push({
                  id: data.playerId,
                  name: data.playerName
                });
              }
            });
            
            // 準備完了プレイヤー数を表示
            playersCollection.get().then(playerSnapshot => {
              let playerCount = 0;
              playerSnapshot.forEach(doc => {
                if (!doc.data().isMaster) {
                  playerCount++;
                }
              });
              
              updateGameStatus(`準備完了: ${readyPlayers.length}/${playerCount}人のプレイヤーが準備完了`);
              
              // 全員が準備完了した場合
              if (readyPlayers.length > 0 && readyPlayers.length === playerCount) {
                updateGameStatus('全員の準備が完了しました！ゲームを開始できます');
                
                // 準備ボタンの表示を更新
                prepareGameBtn.textContent = 'ゲーム準備完了';
                prepareGameBtn.classList.remove('preparing');
                prepareGameBtn.classList.add('ready');
              }
            });
          });
        }
      } else {
        // 準備モードでない場合は準備セクションを非表示
        if (preparationSection) {
          preparationSection.classList.add('hidden');
        }
        
        // マスター画面: 準備ボタンの表示をリセット
        if (prepareGameBtn) {
          prepareGameBtn.textContent = 'ゲーム準備';
          prepareGameBtn.classList.remove('preparing');
          prepareGameBtn.classList.remove('ready');
        }
      }
      
      // 画像を表示
      if (imageContainer) {
        if (gameState.gameStarted && gameState.imagePath) {
          // ゲームが開始された場合のみ画像を表示
          imageContainer.classList.remove('preparing');
          
          // 画像が変更された場合または保存済みの画像がある場合
          if (imageChanged || imageContainer.dataset.loadedImage) {
            // コンテナをクリア
            while (imageContainer.firstChild) {
              imageContainer.removeChild(imageContainer.firstChild);
            }
            
            // 新しい画像を作成して追加
            const img = document.createElement('img');
            img.src = imageContainer.dataset.loadedImage || gameState.imagePath;
            img.alt = gameState.stageName || 'ゲーム画像';
            imageContainer.appendChild(img);
            
            // 現在の画像パスを保存
            imageContainer.dataset.currentImage = gameState.imagePath;
            
            console.log('画像を表示しました:', gameState.imagePath);
          }
        } else if (gameState.gamePreparing) {
          // 準備モード中は画像を表示しない（既に処理済み）
        } else {
          // ゲームが開始されていないかつ準備モードでもない場合
          imageContainer.classList.remove('preparing');
          imageContainer.innerHTML = '';
          imageContainer.dataset.currentImage = '';
          imageContainer.dataset.loadedImage = '';
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
      // プレイヤー情報を非アクティブに設定（削除はしない）
      if (currentPlayer.id) {
        playersCollection.doc(currentPlayer.id).update({
          isActive: false,
          lastLogout: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
      }
      
      // リスナーを解除
      if (unsubscribeGameState) {
        unsubscribeGameState();
      }
    });
    
    // ステータスメッセージを更新する関数（内部で使用できるように追加）
    function updateGameStatus(message) {
      if (statusMessage) {
        statusMessage.textContent = message;
        console.log("ステータスメッセージを更新:", message);
      }
    }

    // 結果発表（ランキング表示）ボタンのイベントリスナー
    showResultsBtn.addEventListener('click', async () => {
      try {
        console.log('結果発表ボタンがクリックされました');
        updateGameStatus('ランキングを生成中...');
        
        // 現在のゲーム状態を取得
        const gameStateDoc = await gameStateCollection.doc('current').get();
        if (gameStateDoc.exists) {
          const gameState = gameStateDoc.data();
          
          // 正解者の一覧を取得するためのデータ準備
          const stageId = gameState.stageId || 'unknown';
          console.log(`ステージID: ${stageId}のランキングを生成します`);
          
          // このステージの正解の回答を取得（クエリを簡略化）
          let allAnswers = await answersCollection
            .where('stageId', '==', stageId)
            .get();
          
          // 正解のみをフィルタリングして手動でソート
          const rankings = [];
          allAnswers.forEach(doc => {
            const answer = doc.data();
            if (answer.isCorrect) {
              rankings.push({
                playerId: answer.playerId,
                playerName: answer.playerName,
                answerTime: answer.answerTime || 0,
                answeredAt: answer.answeredAt,
                pointsEarned: answer.pointsEarned || 0
              });
            }
          });
          
          // ランキングがない場合
          if (rankings.length === 0) {
            console.log('該当ステージの正解者はまだいません');
            updateGameStatus('該当ステージの正解者はまだいません');
            
            // ランキングなしデータを作成して送信
            await gameStateCollection.doc('current').update({
              showRanking: true,
              rankingData: [],
              rankingStageId: stageId,
              stageName: gameState.stageName || '',
              rankingTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return;
          }
          
          // ランキングを時間順にソート
          rankings.sort((a, b) => {
            // 解答時間でソート（小さい順）
            return a.answerTime - b.answerTime;
          });
          
          console.log('生成されたランキング:', rankings);
          
          // ランキングデータをゲーム状態に保存して全プレイヤーに配信
          await gameStateCollection.doc('current').update({
            showRanking: true,
            rankingData: rankings,
            rankingStageId: stageId,
            stageName: gameState.stageName || '',
            rankingTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          updateGameStatus(`${gameState.stageName || 'ステージ'}のランキングを発表しました！`);
        } else {
          console.error('ゲーム状態が見つかりません');
          updateGameStatus('ゲーム状態の取得に失敗しました');
        }
      } catch (error) {
        console.error('ランキング生成エラー:', error);
        updateGameStatus('ランキングの生成に失敗しました: ' + error.message);
      }
    });

    // ランキング結果を表示する関数
    function showRankingResults(rankings, stageName) {
      if (!resultsRanking || !rankingList) return;
      
      // ランキングリストをクリア
      rankingList.innerHTML = '';
      
      // タイトルを設定
      const rankingTitle = resultsRanking.querySelector('h3');
      if (rankingTitle) {
        rankingTitle.textContent = `「${stageName}」のランキング`;
      }
      
      if (rankings.length === 0) {
        // 正解者がいない場合
        const noResultItem = document.createElement('li');
        noResultItem.textContent = 'このステージの正解者はまだいません';
        noResultItem.style.fontStyle = 'italic';
        noResultItem.style.color = '#666';
        rankingList.appendChild(noResultItem);
      } else {
        // ランキングを表示
        rankings.forEach((player, index) => {
          const rankItem = document.createElement('li');
          rankItem.className = 'ranking-item';
          
          // 順位を表示（1位、2位、3位...）
          const rankSpan = document.createElement('span');
          rankSpan.className = 'rank';
          rankSpan.textContent = `${index + 1}位`;
          
          // プレイヤー名を表示
          const nameSpan = document.createElement('span');
          nameSpan.className = 'player-name';
          nameSpan.textContent = player.playerName;
          
          // 解答時間を表示
          const timeSpan = document.createElement('span');
          timeSpan.className = 'answer-time';
          timeSpan.textContent = `${player.answerTime.toFixed(2)}秒`;
          
          // 獲得ポイントを表示
          const pointsSpan = document.createElement('span');
          pointsSpan.className = 'earned-points';
          pointsSpan.textContent = `+${player.pointsEarned}pt`;
          
          // 自分の結果の場合はハイライト
          if (player.playerId === currentPlayer.id) {
            rankItem.classList.add('my-result');
          }
          
          // トップ3を強調
          if (index < 3) {
            rankItem.classList.add(`top-${index + 1}`);
          }
          
          rankItem.appendChild(rankSpan);
          rankItem.appendChild(nameSpan);
          rankItem.appendChild(timeSpan);
          rankItem.appendChild(pointsSpan);
          rankingList.appendChild(rankItem);
        });
      }
      
      // ランキング表示を表示
      resultsRanking.classList.remove('hidden');
    }

    // ヒント購入ボタンのイベントリスナー
    buyHintBtn.addEventListener('click', async () => {
      try {
        // 現在のゲーム状態を取得
        const gameStateDoc = await gameStateCollection.doc('current').get();
        if (!gameStateDoc.exists) {
          console.error('ゲーム状態が見つかりません');
          return;
        }
        
        const gameState = gameStateDoc.data();
        
        // プレイヤーが既に正解済みの場合はヒント購入不可
        if (currentPlayer.answerCorrect) {
          hintContent.textContent = `既に正解しているので、ヒントは必要ありません。`;
          hintContent.classList.remove('hidden');
          return;
        }
        
        // ステージの情報を取得
        const stageId = gameState.stageId;
        const hintCost = gameState.hintCost || 5;
        const hintText = gameState.hint || 'ヒントはありません';
        
        // プレイヤーのポイントを確認
        if (currentPlayer.points < hintCost) {
          // ポイント不足
          hintContent.textContent = `ポイントが足りません。ヒントを見るには${hintCost}ポイント必要です。`;
          hintContent.classList.remove('hidden');
          return;
        }
        
        // ポイントを消費してヒントを表示
        currentPlayer.points -= hintCost;
        
        // Firestoreのプレイヤー情報を更新
        await playersCollection.doc(currentPlayer.id).update({
          points: firebase.firestore.FieldValue.increment(-hintCost),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          usedHint: true,
          usedHintAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // ヒントを表示
        hintContent.textContent = hintText;
        hintContent.classList.remove('hidden');
        hintContent.classList.add('show-hint');
        
        // ボタンを無効化
        buyHintBtn.disabled = true;
        buyHintBtn.textContent = 'ヒント購入済み';
        
        // ローカルストレージも更新
        const savedPlayer = loadFromLocalStorage('currentPlayer') || {};
        savedPlayer.points = currentPlayer.points;
        saveToLocalStorage('currentPlayer', savedPlayer);
        
        // ポイント表示を更新
        updatePointsDisplay(currentPlayer.points);
        
        // ヒント購入記録をFirestoreに保存
        await answersCollection.doc(`hint_${currentPlayer.id}_${Date.now()}`).set({
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          stageId: stageId,
          hintCost: hintCost,
          usedAt: firebase.firestore.FieldValue.serverTimestamp(),
          isHintPurchase: true
        });
        
        console.log(`プレイヤー ${currentPlayer.name} がヒントを購入しました (${hintCost}pt)`);
        updateGameStatus(`ヒントを表示しました (-${hintCost}pt)`);
        
      } catch (error) {
        console.error('ヒント購入エラー:', error);
        updateGameStatus('ヒントの表示に失敗しました');
      }
    });

    // プレイヤーポイントのリアルタイムリスナー
    function startPlayerPointsListener() {
      if (!currentPlayer.id) return;
      
      // プレイヤーのドキュメントをリアルタイムで監視
      return playersCollection.doc(currentPlayer.id)
        .onSnapshot(doc => {
          if (doc.exists) {
            const playerData = doc.data();
            // 前回のポイントを保存
            const oldPoints = currentPlayer.points;
            // ポイントが増加した場合のみアニメーション表示
            const newPoints = playerData.points;
            
            // プレイヤーの状態を同期する（ポイントだけでなく、回答状態なども）
            currentPlayer.answered = playerData.answered || false;
            currentPlayer.answerCorrect = playerData.answerCorrect || false;
            currentPlayer.stageId = playerData.stageId;
            
            // 解答欄の状態を同期
            if (currentPlayer.answerCorrect && playerAnswer && submitAnswerBtn) {
              playerAnswer.disabled = true;
              submitAnswerBtn.disabled = true;
              
              // 正解メッセージがなければ表示
              if (answerResult && !answerResult.classList.contains('correct')) {
                answerResult.textContent = `正解！！ +${playerData.lastPointReward || 0}ポイント獲得`;
                answerResult.className = 'correct';
                
                // 解答時間があれば表示
                if (playerData.lastAnswerTime !== undefined && answerTime) {
                  answerTime.textContent = `解答時間: ${playerData.lastAnswerTime.toFixed(2)}秒`;
                }
              }
            }
            
            if (newPoints > oldPoints) {
              // 増加前のポイントを記録
              currentPlayer.oldPoints = oldPoints;
              // 新しいポイントを設定
              currentPlayer.points = newPoints;
              // アニメーション付きで表示を更新
              updatePointsDisplay(newPoints, true);
              
              // ローカルストレージも更新
              const savedPlayer = loadFromLocalStorage('currentPlayer') || {};
              savedPlayer.points = newPoints;
              saveToLocalStorage('currentPlayer', savedPlayer);
              
              console.log(`ポイントが更新されました: ${oldPoints} → ${newPoints}`);
            } else if (newPoints !== oldPoints) {
              // ポイントが減少、または変わらない場合は通常更新
              currentPlayer.points = newPoints;
              updatePointsDisplay(newPoints);
              
              // ローカルストレージも更新
              const savedPlayer = loadFromLocalStorage('currentPlayer') || {};
              savedPlayer.points = newPoints;
              saveToLocalStorage('currentPlayer', savedPlayer);
            }
          }
        }, error => {
          console.error('プレイヤーポイント監視エラー:', error);
        });
    }

    // ゲーム状態の監視を開始
    startGameStateListener();

    // ポイント付与ボタンのイベントリスナー
    const distributePointsBtn = document.getElementById('distribute-points-btn');
    const pointsToDistribute = document.getElementById('points-to-distribute');
    
    distributePointsBtn.addEventListener('click', async () => {
      try {
        // 付与するポイント数を取得
        const pointsAmount = parseInt(pointsToDistribute.value);
        if (isNaN(pointsAmount) || pointsAmount <= 0) {
          updateGameStatus('有効なポイント数を入力してください');
          return;
        }
        
        // 接続中のプレイヤー一覧を取得
        const playersSnapshot = await playersCollection.get();
        if (playersSnapshot.empty) {
          updateGameStatus('付与対象のプレイヤーがいません');
          return;
        }
        
        // 各プレイヤーにポイントを付与
        const batch = db.batch();
        let playerCount = 0;
        
        playersSnapshot.forEach(doc => {
          const playerData = doc.data();
          // マスターは除外
          if (playerData.isMaster) return;
          
          // ポイント付与のバッチ処理を追加
          batch.update(playersCollection.doc(doc.id), {
            points: firebase.firestore.FieldValue.increment(pointsAmount),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          });
          playerCount++;
        });
        
        // バッチ処理を実行
        if (playerCount > 0) {
          await batch.commit();
          console.log(`${playerCount}人のプレイヤーに${pointsAmount}ポイントを付与しました`);
          updateGameStatus(`全プレイヤーに${pointsAmount}ポイントを付与しました`);
          
          // ポイント付与ログをFirestoreに記録
          await gameStateCollection.doc('pointDistributionLog').set({
            amount: pointsAmount,
            playerCount: playerCount,
            distributedAt: firebase.firestore.FieldValue.serverTimestamp(),
            distributedBy: 'master'
          }, { merge: true });
        } else {
          updateGameStatus('付与対象のプレイヤーがいません');
        }
        
      } catch (error) {
        console.error('ポイント付与エラー:', error);
        updateGameStatus('ポイント付与に失敗しました');
      }
    });

    // ページ読み込み時に自動的にプレイヤー情報を復元
    function autoRestorePlayerSession() {
      // ローカルストレージからプレイヤー情報を取得
      const savedPlayer = loadFromLocalStorage('currentPlayer');
      
      if (savedPlayer && savedPlayer.id && savedPlayer.name) {
        console.log('保存されたプレイヤー情報を復元:', savedPlayer.name);
        
        // Firestoreからプレイヤー情報を確認・復元
        playersCollection.doc(savedPlayer.id).get()
          .then(doc => {
            if (doc.exists) {
              // プレイヤー情報があれば復元
              const playerData = doc.data();
              
              // 現在のプレイヤー情報を更新
              currentPlayer = {
                ...playerData,
                isActive: true,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
              };
              
              // Firestoreの情報を更新
              return playersCollection.doc(savedPlayer.id).update({
                isActive: true,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
              });
            } else {
              // プレイヤー情報がなければ新規作成
              console.log('保存されたIDのプレイヤーが見つかりません。新規作成します:', savedPlayer.id);
              
              // プレイヤー情報を作成
              currentPlayer = {
                id: savedPlayer.id,
                name: savedPlayer.name,
                isActive: true,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                answered: false,
                answerCorrect: false,
                points: savedPlayer.points || POINTS_CONFIG.initial,
                stageId: null
              };
              
              // Firestoreに新規プレイヤー情報を保存
              return playersCollection.doc(savedPlayer.id).set(currentPlayer);
            }
          })
          .then(() => {
            // プレイヤー表示を同期
            syncPlayerDisplay();
            
            // プレイヤー画面に遷移
            showScreen('player-panel');
            
            // ポイントのリアルタイムリスナーを開始
            startPlayerPointsListener();
            
            console.log('プレイヤーセッションを自動復元しました:', currentPlayer.name);
          })
          .catch(error => {
            console.error('プレイヤーセッションの自動復元に失敗:', error);
            // エラーが発生した場合は登録画面のままにする
          });
        
        return true;
      }
      
      return false;
    }

    // ページ読み込み時に自動的にプレイヤー情報を復元（すぐに実行）
    const playerRestored = autoRestorePlayerSession();
    if (playerRestored) {
      console.log('プレイヤー情報の自動復元を開始しました');
    } else {
      console.log('保存されたプレイヤー情報がないため、登録画面を表示します');
    }

    // 準備状態関連の要素
    const prepareGameBtn = document.getElementById('prepare-game');
    const preparationSection = document.getElementById('preparation-section');
    const readyBtn = document.getElementById('ready-btn');
    const loadStatus = document.getElementById('load-status');
    const progressBar = document.querySelector('.progress');

    // 画像のプリロード関数
    function preloadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    }

    // 画像のプリロード処理
    async function prepareGameImages(gameState) {
      if (!gameState || !gameState.imagePath) {
        console.error('画像パスがありません');
        return false;
      }
      
      try {
        // プリロード状態を初期化
        if (progressBar) progressBar.style.width = '0%';
        if (loadStatus) loadStatus.textContent = '画像をロード中（0%）';
        
        // 画像コンテナを非表示または代替表示に
        if (imageContainer) {
          // 画像コンテナを空にして「準備中」メッセージを表示
          imageContainer.innerHTML = '';
          imageContainer.classList.add('preparing');
          const preparingMsg = document.createElement('div');
          preparingMsg.className = 'preparing-message';
          preparingMsg.textContent = '画像準備中...';
          imageContainer.appendChild(preparingMsg);
        }
        
        // プリロード準備
        console.log(`画像をプリロードします: ${gameState.imagePath}`);
        
        // 進捗表示のモック（実際は非同期処理）
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress <= 90) {
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (loadStatus) loadStatus.textContent = `画像をロード中（${progress}%）`;
          }
        }, 100);
        
        // 実際のプリロード処理
        const loadedImage = await preloadImage(gameState.imagePath);
        console.log('画像のプリロードが完了しました');
        
        // 進捗表示の完了
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (loadStatus) loadStatus.textContent = '画像のロードが完了しました！';
        
        // 準備完了ボタンを有効化
        if (readyBtn) {
          readyBtn.disabled = false;
        }
        
        // 画像は保存するが表示はまだしない
        if (imageContainer) {
          // 画像データを保存するが表示はしない
          imageContainer.dataset.loadedImage = gameState.imagePath;
          // 「準備完了」メッセージに更新
          imageContainer.innerHTML = '';
          const readyMsg = document.createElement('div');
          readyMsg.className = 'ready-message';
          readyMsg.textContent = '準備完了！ゲーム開始をお待ちください';
          imageContainer.appendChild(readyMsg);
        }
        
        // ロード完了状態をFirestoreに保存
        if (currentPlayer && currentPlayer.id) {
          await readyStateCollection.doc(currentPlayer.id).set({
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            isReady: currentPlayer.isReady || false,
            isLoaded: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            stageId: gameState.stageId
          }, { merge: true });
        }
        
        return true;
      } catch (error) {
        console.error('画像のプリロードに失敗しました:', error);
        if (loadStatus) loadStatus.textContent = 'エラー: 画像のロードに失敗しました。';
        return false;
      }
    }

    // プレイヤーの準備状態を更新する関数
    async function updatePlayerReadyState(isReady) {
      if (!currentPlayer.id) return;
      
      try {
        // 準備状態の更新
        await readyStateCollection.doc(currentPlayer.id).set({
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          isReady: isReady,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          stageId: currentPlayer.stageId
        });
        
        console.log(`プレイヤー ${currentPlayer.name} の準備状態を更新: ${isReady}`);
        
        // ボタン表示を更新
        if (readyBtn) {
          if (isReady) {
            readyBtn.textContent = '準備完了！';
            readyBtn.classList.add('ready');
          } else {
            readyBtn.textContent = '準備完了';
            readyBtn.classList.remove('ready');
          }
        }
        
        // プレイヤーの状態も更新
        currentPlayer.isReady = isReady;
        
      } catch (error) {
        console.error('準備状態の更新に失敗しました:', error);
      }
    }

    // 準備状態をリセットする関数
    async function resetReadyStates() {
      try {
        // readyStateコレクションの全ドキュメントを削除
        const snapshot = await readyStateCollection.get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('全プレイヤーの準備状態をリセットしました');
      } catch (error) {
        console.error('準備状態のリセットに失敗しました:', error);
      }
    }

    // ゲーム準備ボタンのイベントリスナー
    if (prepareGameBtn) {
      prepareGameBtn.addEventListener('click', async () => {
        try {
          // ステージ選択から現在のステージを取得
          const stageSelector = document.getElementById('stage-selector');
          if (!stageSelector) throw new Error('ステージセレクタが見つかりません');
          
          const selectedStageId = stageSelector.value;
          const selectedStage = STAGES[selectedStageId];
          
          if (!selectedStage) throw new Error('選択されたステージが無効です');
          
          // 準備状態をリセット
          await resetReadyStates();
          
          // ゲーム状態を更新
          const gameState = createGameState(false, selectedStage);
          gameState.gamePreparing = true;
          
          await gameStateCollection.doc('current').set(gameState);
          
          console.log('ゲーム準備モードを開始しました:', selectedStage.name);
          updateGameStatus(`ゲーム準備モードを開始しました: ${selectedStage.name}`);
          
          // ボタンの見た目を変更
          prepareGameBtn.textContent = '準備中...';
          prepareGameBtn.classList.add('preparing');
          
        } catch (error) {
          console.error('ゲーム準備の開始に失敗しました:', error);
          updateGameStatus('ゲーム準備の開始に失敗しました');
        }
      });
    }

    // 準備完了ボタンのイベントリスナー
    if (readyBtn) {
      readyBtn.addEventListener('click', () => {
        // 現在の状態を切り替え
        const newReadyState = !currentPlayer.isReady;
        updatePlayerReadyState(newReadyState);
      });
    }

  } catch (error) {
    console.error("App initialization error:", error);
    alert("アプリケーションエラー: " + error.message);
  }
}); 