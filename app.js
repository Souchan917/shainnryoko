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
        correctAnswer: ['箱根', 'はこね', 'ハコネ'],
        imagePath: 'images/puzzles/puzzle1.png',
        pointReward: 10,
        hint: 'フルーツの王様とも呼ばれています。赤い色が特徴的です。',
        hintCost: 5  // ヒントを見るのに必要なポイント
      },
      stage2: {
        id: 'stage2',
        name: 'ステージ2',
        correctAnswer: ['ばなな', 'バナナ', 'banana'],
        imagePath: 'images/puzzles/puzzle2.png',
        pointReward: 20,
        hint: '黄色い曲がった形が特徴的なフルーツです。猿も大好きです。',
        hintCost: 7  // ヒントを見るのに必要なポイント
      },
      stage3: {
        id: 'stage3',
        name: 'ステージ3',
        correctAnswer: ['みかん', 'ミカン', 'orange', 'オレンジ'],
        imagePath: 'images/puzzles/puzzle3.png',
        pointReward: 30,
        hint: '冬になると食べたくなる、オレンジ色の柑橘系フルーツです。',
        hintCost: 10  // ヒントを見るのに必要なポイント
      },
      stage4: {
        id: 'stage4',
        name: 'ステージ4',
        correctAnswer: ['すもももももももものうち', 'スモモモモモモモモノウチ', '李も桃も桃の内'],
        imagePath: 'images/puzzles/puzzle4.png',
        pointReward: 40,
        hint: '紫色の小さな実が房になっています。ワインの原料としても有名です。',
        hintCost: 12
      },
      stage5: {
        id: 'stage5',
        name: 'ステージ5',
        correctAnswer: ['すもももももももものうち', 'スモモモモモモモモノウチ', '李も桃も桃の内'],
        imagePath: 'images/puzzles/puzzle5.png',
        pointReward: 50,
        hint: '夏に食べる大きな緑色のフルーツ。中身は赤くて種があります。',
        hintCost: 15
      },
      stage6: {
        id: 'stage6',
        name: 'ステージ6',
        correctAnswer: ['いちご', 'イチゴ', 'strawberry', 'ストロベリー'],
        imagePath: 'images/puzzles/puzzle6.png',
        pointReward: 60,
        hint: '春に収穫される赤い小さなフルーツで、表面に小さな種があります。',
        hintCost: 18
      },
      stage7: {
        id: 'stage7',
        name: 'ステージ7',
        correctAnswer: ['もも', 'モモ', 'peach', 'ピーチ'],
        imagePath: 'images/puzzles/puzzle7.png',
        pointReward: 70,
        hint: 'ピンク色の柔らかい果肉と甘い香りが特徴です。表面は産毛があります。',
        hintCost: 20
      },
      stage8: {
        id: 'stage8',
        name: 'ステージ8',
        correctAnswer: ['おかし', 'お菓子', 'オカシ'],
        imagePath: 'images/puzzles/puzzle8.png',
        pointReward: 80,
        hint: '熱帯地域で育つ黄色い果肉と硬い外皮が特徴的なフルーツです。',
        hintCost: 22
      },
      stage9: {
        id: 'stage9',
        name: 'ステージ9',
        correctAnswer: ['キウイ', 'きうい', 'kiwi', 'キウイフルーツ'],
        imagePath: 'images/puzzles/puzzle9.png',
        pointReward: 90,
        hint: '茶色の毛が生えた皮と、中の緑色の果肉が特徴です。酸味があります。',
        hintCost: 25
      },
      stage10: {
        id: 'stage10',
        name: 'ステージ10',
        correctAnswer: ['マンゴー', 'まんごー', 'mango'],
        imagePath: 'images/puzzles/puzzle10.png',
        pointReward: 100,
        hint: '南国のフルーツで、オレンジ色の甘い果肉があります。石のような大きな種があります。',
        hintCost: 28
      },
      stage11: {
        id: 'stage11',
        name: 'ステージ11',
        correctAnswer: ['さくらんぼ', 'サクランボ', 'cherry', 'チェリー'],
        imagePath: 'images/puzzles/puzzle11.png',
        pointReward: 110,
        hint: '小さな赤い実で、長い茎がついています。ケーキの飾りとしても使われます。',
        hintCost: 30
      },
      stage12: {
        id: 'stage12',
        name: 'ステージ12',
        correctAnswer: ['レモン', 'れもん', 'lemon'],
        imagePath: 'images/puzzles/puzzle12.png',
        pointReward: 120,
        hint: '黄色い皮と酸っぱい味が特徴的な柑橘系のフルーツです。',
        hintCost: 32
      },
      stage13: {
        id: 'stage13',
        name: 'ステージ13',
        correctAnswer: ['ライチ', 'らいち', 'lychee'],
        imagePath: 'images/puzzles/puzzle13.png',
        pointReward: 130,
        hint: '赤い鱗状の皮に覆われ、中は白い果肉です。中国原産のフルーツです。',
        hintCost: 35
      },
      stage14: {
        id: 'stage14',
        name: 'ステージ14',
        correctAnswer: ['アボカド', 'あぼかど', 'avocado'],
        imagePath: 'images/puzzles/puzzle14.png',
        pointReward: 140,
        hint: '緑色の果肉と大きな種を持つ、脂質の多いフルーツです。料理に使われることも多いです。',
        hintCost: 38
      },
      stage15: {
        id: 'stage15',
        name: 'ステージ15',
        correctAnswer: ['ドラゴンフルーツ', 'どらごんふるーつ', 'dragonfruit', 'ピタヤ', 'ぴたや'],
        imagePath: 'images/puzzles/puzzle15.png',
        pointReward: 150,
        hint: 'ピンクの外皮と白または赤い果肉に黒い種が散らばっている、エキゾチックなフルーツです。',
        hintCost: 40
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
      
      // 正解画像のパスを生成
      const stageNumber = selectedStage ? selectedStage.id.replace('stage', '') : '1';
      const answerImagePath = `images/answers/answer${stageNumber}.png`;
      
      return {
        gameStarted: started,
        stageId: selectedStage ? selectedStage.id : null,
        stageName: selectedStage ? selectedStage.name : null,
        correctAnswer: selectedStage ? selectedStage.correctAnswer : CORRECT_ANSWER,
        pointReward: selectedStage ? selectedStage.pointReward : POINTS_CONFIG.correctAnswer,
        hint: selectedStage ? selectedStage.hint : null,
        hintCost: selectedStage ? selectedStage.hintCost : 5,
        imagePath: actualImagePath,
        answerImagePath: answerImagePath,
        showAnswer: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        startTime,
        endTime: null,
        points: POINTS_CONFIG.initial,
        isPreparing: false, // ゲーム準備中フラグ
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
    const showAnswerBtn = document.getElementById('show-answer'); // 正解表示ボタン
    const resetGameBtn = document.getElementById('reset-game');
    const imageContainer = document.getElementById('image-container');
    const answerImageContainer = document.getElementById('answer-image-container'); // 正解画像コンテナ
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
      // 既存のリスナーがあれば解除
      if (window.unsubscribePlayersListener) {
        window.unsubscribePlayersListener();
      }
      
      // onSnapshotを使ってリアルタイム監視に変更
      window.unsubscribePlayersListener = playersCollection.onSnapshot(snapshot => {
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
      }, error => {
        console.error('プレイヤーリスト監視エラー:', error);
      });
    }
    
    // 解答状況を更新する関数
    function updateAnswersList() {
      // 既存のリスナーがあれば解除
      if (window.unsubscribeAnswersListener) {
        window.unsubscribeAnswersListener();
      }
      
      // onSnapshotを使用してリアルタイム監視に変更
      window.unsubscribeAnswersListener = answersCollection.orderBy('answeredAt', 'desc')
        .onSnapshot(snapshot => {
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
        }, error => {
          console.error('解答リスト監視エラー:', error);
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
            // 正解かどうかを確認（複数の正解のいずれかに一致するか確認）
            const playerAnswerLower = answer.toLowerCase();
            const correctAnswers = Array.isArray(gameState.correctAnswer) 
              ? gameState.correctAnswer 
              : [gameState.correctAnswer]; // 後方互換性のため
            
            const isCorrect = correctAnswers.some(correct => 
              correct.toLowerCase() === playerAnswerLower
            );
            
            console.log(`回答チェック: "${answer}" に対して ${correctAnswers.length}個の正解候補をチェック => ${isCorrect}`);
            
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
        console.log('正解候補:', CORRECT_ANSWER.join(', '));
        
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
      // リアルタイムリスナーを使用して一度に全ドキュメントを取得
      return new Promise((resolve, reject) => {
        // 一時的なリスナーを設定して全データを取得
        const unsubscribe = answersCollection.onSnapshot(snapshot => {
          unsubscribe(); // 即座にリスナーを解除
          
          if (snapshot.empty) {
            console.log('削除する解答がありません');
            resolve();
            return;
          }
          
          // バッチ処理で削除
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          // バッチ実行
          batch.commit()
            .then(() => {
              console.log(`${snapshot.size}件の解答を削除しました`);
              resolve();
            })
            .catch(error => {
              console.error('解答削除エラー:', error);
              reject(error);
            });
        }, error => {
          console.error('解答データ取得エラー:', error);
          reject(error);
        });
      });
    }
    
    // すべてのプレイヤーの解答状態をリセットする関数
    function resetAllPlayerAnswers() {
      // リアルタイムリスナーを使用して一度に全ドキュメントを取得
      return new Promise((resolve, reject) => {
        // 一時的なリスナーを設定して全データを取得
        const unsubscribe = playersCollection.onSnapshot(snapshot => {
          unsubscribe(); // 即座にリスナーを解除
          
          if (snapshot.empty) {
            console.log('リセットするプレイヤーがいません');
            resolve();
            return;
          }
          
          // バッチ処理でリセット
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.update(doc.ref, {
              answered: false,
              answerCorrect: false
            });
          });
          
          // バッチ実行
          batch.commit()
            .then(() => {
              console.log(`${snapshot.size}人のプレイヤーの解答状態をリセットしました`);
              resolve();
            })
            .catch(error => {
              console.error('プレイヤー解答状態リセットエラー:', error);
              reject(error);
            });
        }, error => {
          console.error('プレイヤーデータ取得エラー:', error);
          reject(error);
        });
      });
    }
  
    // マスター側：リセット
    resetGameBtn.addEventListener('click', async () => {
      if (confirm('ゲームをリセットしますか？')) {
        try {
          // 初期ゲーム状態を作成
          const initialGameState = createGameState(false);
          
          // ゲーム状態をリセット
          await gameStateCollection.doc('current').set(initialGameState);
          
          // 全プレイヤーの解答状態をリセット
          await resetAllPlayerAnswers();
          
          // 全ての解答をクリア
          await deleteAllAnswers();
          
          updateGameStatus('ゲームがリセットされました');
        } catch (error) {
          console.error('ゲームリセット中にエラーが発生しました:', error);
          updateGameStatus('ゲームリセット中にエラーが発生しました');
        }
      }
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

      // ゲーム準備中の場合は画像をプリロードする
      if (gameState.isPreparing && gameState.imagePath) {
        console.log('画像のプリロード開始:', gameState.imagePath);
        
        // 隠し要素に画像をプリロード
        const preloadContainer = document.createElement('div');
        preloadContainer.style.display = 'none';
        preloadContainer.id = 'preload-container';
        
        // 既存のプリロードコンテナを削除
        const existingContainer = document.getElementById('preload-container');
        if (existingContainer) {
          existingContainer.remove();
        }
        
        // 新しいプリロードコンテナを追加
        document.body.appendChild(preloadContainer);
        
        // 画像をプリロード
        preloadImage(gameState.imagePath)
          .then(() => {
            console.log('画像のプリロードが完了しました:', gameState.imagePath);
            // プリロードは成功したが、表示はしない
          })
          .catch(error => {
            console.error('画像のプリロードに失敗しました:', error);
          });
          
        // 準備中は他の表示処理は行わない
        return;
      }

      // ランキング表示の処理
      if (gameState.showRanking && gameState.rankingStageId) {
        console.log('ランキング表示を更新');
        
        // ランキングコンテナの参照を取得
        const resultsRanking = document.getElementById('results-ranking');
        
        // ランキングコンテナが非表示の場合は表示する
        if (resultsRanking && resultsRanking.classList.contains('hidden')) {
          resultsRanking.classList.remove('hidden');
        }
        
        // ランキングセクションが表示された後に確実に自動スクロール
        setTimeout(() => {
          if (resultsRanking) {
            // window.scrollTo を使って画面上部に強制的にスクロール
            const yOffset = 30; // ページ上部から少し下にスクロール位置を調整
            const y = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
            
            window.scrollTo({
              top: y,
              behavior: 'smooth'
            });
            console.log('ランキングを画面上部に表示するためにスクロールしました');
            
            // さらに確実にスクロールするため、少し遅れて再度スクロール
            setTimeout(() => {
              const updatedY = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
              window.scrollTo({
                top: updatedY,
                behavior: 'smooth'
              });
              console.log('ランキング位置を再確認してスクロールしました');
            }, 500);
          }
        }, 100);
        
        // ランキングデータが存在する場合
        if (gameState.rankingData) {
          // ランキングを表示
          showRankingResults(
            { name: gameState.stageName || '不明なステージ' },
            gameState.rankingData
          );
        } else {
          console.log('ランキングデータがありません');
          showRankingResults(
            { name: gameState.stageName || '不明なステージ' },
            []
          );
        }
      } else if (document.getElementById('results-ranking')) {
        // ランキング表示をしない場合は非表示
        document.getElementById('results-ranking').classList.add('hidden');
      }

      // 正解画像の表示/非表示
      if (answerImageContainer) {
        // 正解表示フラグがtrueの場合、正解画像を表示
        if (gameState.showAnswer) {
          console.log('正解画像を表示します', gameState);
          answerImageContainer.classList.remove('hidden');
          
          // 正解画像表示時には解答欄を無効化
          setAnswerInputState(false);
          console.log('正解画像表示のため解答入力を無効化しました');
          
          // 正解画像が表示された時に自動スクロール
          setTimeout(() => {
            answerImageContainer.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
            console.log('正解画像に自動スクロールしました');
          }, 300);
          
          // 正解画像コンテナの中身をクリア
          const answerImageDiv = answerImageContainer.querySelector('.answer-image');
          if (answerImageDiv) {
            answerImageDiv.innerHTML = '';
            
            // 正解画像のパスを生成
            const answerImagePath = gameState.answerImagePath || 
              `images/answers/answer${gameState.stageId ? gameState.stageId.replace('stage', '') : '1'}.png`;
            
            console.log('正解画像パス:', answerImagePath);
            
            // 正解画像要素の作成
            const answerImg = document.createElement('img');
            answerImg.src = answerImagePath;
            answerImg.alt = '正解画像';
            answerImg.onload = () => {
              // 画像が読み込まれたらフェードイン効果
              answerImg.style.opacity = '1';
            };
            answerImg.style.opacity = '0';
            answerImg.style.transition = 'opacity 0.5s ease-in-out';
            
            answerImageDiv.appendChild(answerImg);
          }
        } else {
          // 正解表示フラグがfalseの場合、正解画像を非表示
          answerImageContainer.classList.add('hidden');
          
          // 正解画像を非表示にしたとき、プレイヤーがまだ正解していなければ解答欄を有効化
          // ただし、blockAllAnswersフラグがtrueの場合は有効化しない
          if (currentPlayer && !currentPlayer.answerCorrect && gameState.gameStarted && !gameState.blockAllAnswers) {
            setAnswerInputState(true);
            console.log('正解画像非表示かつプレイヤー未正解のため解答入力を有効化しました');
          }
        }
      }
      
      // すべての解答を禁止するフラグがある場合、解答欄を無効化
      // この処理は他の条件より優先
      if (gameState.blockAllAnswers) {
        setAnswerInputState(false);
        console.log('すべての解答が禁止されているため解答入力を無効化しました');
      }

      // ゲーム開始時刻を設定（解答時間計算用）
      if (gameState.gameStarted && gameState.startTime) {
        // 新しいゲーム開始かどうかを判断するための変数
        const isNewGame = !currentPlayer.stageId || currentPlayer.stageId !== gameState.stageId;
        
        if (typeof gameState.startTime === 'object' && gameState.startTime.toDate) {
          // Firestoreのタイムスタンプオブジェクトの場合
          gameStartTime = gameState.startTime.toDate().getTime();
        } else if (typeof gameState.startTime === 'string') {
          // ISOString形式の場合
          gameStartTime = new Date(gameState.startTime).getTime();
        } else {
          // その他の形式またはミリ秒タイムスタンプの場合
          gameStartTime = gameState.startTime;
        }
        console.log('ゲーム開始時刻を設定:', gameStartTime);
        
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
        gameStartTime = null;
        console.log('ゲーム開始時刻をリセットしました');
        
        // ヒントセクションを非表示
        if (hintSection) {
          hintSection.classList.add('hidden');
        }
      }

      // 画像を表示
      if (imageContainer && gameState) {
        if (gameState.gameStarted && gameState.imagePath) {
          // 画像を表示
          imageContainer.innerHTML = `<img id="puzzle-image" src="${gameState.imagePath}" alt="${gameState.stageName || 'ゲーム画像'}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
          
          // ゲーム中のメッセージ
          const gameContentP = document.querySelector('#game-content > p');
          if (gameContentP) {
            gameContentP.textContent = `ゲームが開始されました！ステージ: ${gameState.stageName || ''}`;
            gameContentP.classList.add('game-started');
          }
          
          // 解答欄を表示
          if (answerSection) {
            answerSection.classList.remove('hidden');
            
            // 新しいステージでなければ、かつプレイヤーが正解していない場合のみ入力欄をクリア
            if (playerAnswer && (!currentPlayer.answerCorrect || currentPlayer.stageId !== gameState.stageId)) {
              // 正解済みプレイヤーの場合は入力欄をクリアしない
              if (!currentPlayer.answerCorrect) {
                playerAnswer.value = '';
                playerAnswer.focus();
              }
            }
          }
        } else {
          // ゲームが開始されていない場合
          imageContainer.innerHTML = '';
          
          // 待機中のメッセージ
          const gameContentP = document.querySelector('#game-content > p');
          if (gameContentP) {
            gameContentP.textContent = 'マスターがゲームを開始するのを待っています...';
            gameContentP.classList.remove('game-started');
          }
          
          // 解答欄を非表示
          if (answerSection) {
            answerSection.classList.add('hidden');
          }
          
          // 解答関連の状態をリセット
          resetAnswerInput();
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
            
          // 回答時間でソート（昇順 = 早い順）
          rankings.sort((a, b) => a.answerTime - b.answerTime);
          console.log('ソート済みランキング:', rankings);
          
          // ランキングの表示
          const resultsRanking = document.getElementById('results-ranking');
          
          // ランキングがない場合
          if (rankings.length === 0) {
            console.log('該当ステージの正解者はまだいません');
            updateGameStatus('該当ステージの正解者はまだいません');
          }
          
          // ランキングセクションを表示して自動スクロール
          if (resultsRanking) {
            resultsRanking.classList.remove('hidden');
            
            // ランキングセクションが表示された後に確実に自動スクロール
            setTimeout(() => {
              // window.scrollTo を使って画面上部に強制的にスクロール
              const yOffset = 30; // ページ上部から少し下にスクロール位置を調整
              const y = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
              
              window.scrollTo({
                top: y,
                behavior: 'smooth'
              });
              console.log('ランキングを画面上部に表示するためにスクロールしました');
              
              // さらに確実にスクロールするため、少し遅れて再度スクロール
              setTimeout(() => {
                const updatedY = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
                window.scrollTo({
                  top: updatedY,
                  behavior: 'smooth'
                });
                console.log('ランキング位置を再確認してスクロールしました');
              }, 500);
            }, 100);
          }
          
          // ランキングを表示
          showRankingResults(
            { id: stageId, name: gameState.stageName || '不明なステージ' },
            rankings
          );
          
          // Firestoreのゲーム状態にランキングデータを保存
          await gameStateCollection.doc('current').update({
            showRanking: true,
            rankingStageId: stageId,
            rankingData: rankings,
            rankingTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          updateGameStatus('ランキングを表示しました');
        } else {
          console.error('ゲーム状態が見つかりません');
          updateGameStatus('ゲーム状態が見つかりません');
        }
      } catch (error) {
        console.error('ランキング生成エラー:', error);
        updateGameStatus('ランキングの生成に失敗しました: ' + error.message);
      }
    });

    // ランキング結果を表示する関数
    function showRankingResults(stage, rankings) {
      // ランキングリストをクリア
      const rankingList = document.getElementById('ranking-list');
      const rankingTitle = document.getElementById('ranking-title');
      const resultsRanking = document.getElementById('results-ranking');
      
      if (!rankingList || !rankingTitle) return;
      
      rankingList.innerHTML = '';
      
      // ランキングコンテナが非表示の場合は表示する
      if (resultsRanking && resultsRanking.classList.contains('hidden')) {
        resultsRanking.classList.remove('hidden');
      }

      // まず確実にランキングコンテナを表示位置までスクロールする
      // setTimeout を使って DOM 更新後に実行されるようにする
      setTimeout(() => {
        if (resultsRanking) {
          // window.scrollTo を使って画面上部に強制的にスクロール
          const yOffset = 30; // ページ上部から少し下にスクロール位置を調整
          const y = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
          
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
          console.log('ランキングを画面上部に表示するためにスクロールしました');
          
          // さらに確実にスクロールするため、少し遅れて再度スクロール
          setTimeout(() => {
            const updatedY = resultsRanking.getBoundingClientRect().top + window.pageYOffset - yOffset;
            window.scrollTo({
              top: updatedY,
              behavior: 'smooth'
            });
            console.log('ランキング位置を再確認してスクロールしました');
          }, 500);
        }
      }, 100);
      
      // stageが文字列の場合とオブジェクトの場合の両方に対応
      const stageName = typeof stage === 'string' ? stage : (stage && stage.name ? stage.name : '不明なステージ');
      rankingTitle.textContent = `${stageName} ランキング`;
      
      console.log('ランキング表示 - ステージ:', stageName, '- データ:', rankings);
      
      // 正解者がいない場合
      if (!rankings || rankings.length === 0) {
        const noResultItem = document.createElement('li');
        noResultItem.className = 'no-results';
        noResultItem.textContent = '正解者はまだいません';
        rankingList.appendChild(noResultItem);
        return;
      }
      
      // ランキングアイテムを作成しておく（表示はまだしない）
      const rankingItems = [];
      
      // ランキングを作成
      rankings.forEach((result, index) => {
        const rank = index + 1;
        const listItem = document.createElement('li');
        listItem.className = 'ranking-item';
        
        // 上位3位にはクラスを追加
        if (rank === 1) {
          listItem.classList.add('top-1');
          listItem.setAttribute('data-rank', '1');
          // 1位は一番上に配置
          listItem.style.order = '1';
        }
        else if (rank === 2) {
          listItem.classList.add('top-2');
          listItem.setAttribute('data-rank', '2');
          // 2位は2番目に配置
          listItem.style.order = '2';
        }
        else if (rank === 3) {
          listItem.classList.add('top-3');
          listItem.setAttribute('data-rank', '3');
          // 3位は3番目に配置
          listItem.style.order = '3';
        } else {
          listItem.setAttribute('data-rank', rank);
          // 4位以降は順位に応じて下に配置
          listItem.style.order = String(rank);
        }
        
        // 自分の結果にはクラスを追加
        if (result.playerId === currentPlayer.id) {
          listItem.classList.add('my-result');
        }
        
        // アニメーション用のクラスを追加
        listItem.classList.add('hidden');
        
        // 内容を構築
        listItem.innerHTML = `
          <div class="rank">${rank}位</div>
          <div class="player-name">${result.playerName}</div>
          <div class="answer-time">${result.answerTime.toFixed(2)}秒</div>
          <div class="earned-points">+${result.pointsEarned}pt</div>
        `;
        
        // 配列に追加
        rankingItems.push({
          element: listItem,
          rank: rank
        });
      });
      
      // 演出のために1位、2位、3位とそれ以外に分ける
      const firstPlace = rankingItems.find(item => item.rank === 1);
      const secondPlace = rankingItems.find(item => item.rank === 2);
      const thirdPlace = rankingItems.find(item => item.rank === 3);
      const otherPlaces = rankingItems.filter(item => item.rank > 3);
      
      // ランキングタイトルを演出的に変更
      if (rankingTitle) {
        rankingTitle.textContent = `${stageName} ランキング発表`;
        rankingTitle.classList.add('title-announcing');
      }
      
      // 開始の演出
      updateGameStatus('ランキング発表を開始します...');
      
      // 全アイテムをDOMに追加（表示はhiddenのまま）
      // DOM配置とアニメーションを分離して、順位の配置を正しく行う
      rankingItems.forEach(item => {
        rankingList.appendChild(item.element);
      });
      
      // アニメーションのタイミングを設定
      let delay = 800; // 開始時の遅延（ミリ秒） - 演出のため長めに
      const itemDelay = 200; // 各アイテム間の遅延を0.2秒に統一
      const specialDelay = 600; // 特別な順位（TOP3）の間の遅延
      
      // 演出開始 - 下位から順に表示
      updateGameStatus('まずは下位から発表します...');
      
      // 下位からの表示前に少し待つ
      setTimeout(() => {
        // 下位から順に表示（15位から4位まで）
        if (otherPlaces.length > 0) {
          // 順位の降順（大きい順）に並び替え - 15位、14位、...という順序に
          const sortedOthers = [...otherPlaces].sort((a, b) => b.rank - a.rank);
          
          // 一つずつ順番に表示
          sortedOthers.forEach((item, index) => {
            setTimeout(() => {
              item.element.classList.remove('hidden');
              item.element.classList.add('reveal');
              
              // 最後の項目表示後に少し間を開ける
              if (index === sortedOthers.length - 1) {
                updateGameStatus('続いて上位3名の発表です...');
              }
            }, index * itemDelay);
          });
          
          // 次に3位を表示する準備（下位表示後に少し間を空ける）
          delay += (sortedOthers.length * itemDelay) + 1000;
        } else {
          // 下位がいない場合は直接3位からスタート
          updateGameStatus('上位3名の発表です...');
          delay += 500;
        }
        
        // TOP3を順番に表示する（3位→2位→1位）
        if (thirdPlace) {
          setTimeout(() => {
            // 表示する時に効果音を鳴らしたりする場合はここに追加
            updateGameStatus('🥉 3位発表！');
            setTimeout(() => {
              document.querySelector('[data-rank="3"]').classList.remove('hidden');
              document.querySelector('[data-rank="3"]').classList.add('reveal-bronze');
            }, 300); // 効果音のための少しの遅延
          }, delay);
          delay += specialDelay;
        }
        
        if (secondPlace) {
          setTimeout(() => {
            updateGameStatus('🥈 2位発表！');
            setTimeout(() => {
              document.querySelector('[data-rank="2"]').classList.remove('hidden');
              document.querySelector('[data-rank="2"]').classList.add('reveal-silver');
            }, 300);
          }, delay);
          delay += specialDelay;
        }
        
        // 1位の発表前に少し間を空ける
        delay += 400;
        
        if (firstPlace) {
          // 1位発表前のカウントダウン効果
          setTimeout(() => {
            updateGameStatus('そして栄えある優勝者は...');
          }, delay);
          
          // カウントダウンを短縮（約1秒に）
          setTimeout(() => { updateGameStatus('3...'); }, delay + 300);
          setTimeout(() => { updateGameStatus('2...'); }, delay + 600);
          setTimeout(() => { updateGameStatus('1...'); }, delay + 900);
          
          // 1位の発表（特別な演出付き）
          setTimeout(() => {
            document.querySelector('[data-rank="1"]').classList.remove('hidden');
            document.querySelector('[data-rank="1"]').classList.add('reveal-gold');
            updateGameStatus('🏆 優勝者発表！おめでとうございます！🎉');
            
            // 背景でキラキラエフェクトなどを表示したい場合はここで追加
            const resultSection = document.getElementById('results-ranking');
            resultSection.classList.add('winner-announced');
            
            // ランキングタイトルも更新
            if (rankingTitle) {
              rankingTitle.textContent = `${stageName} 優勝者：${firstPlace.element.querySelector('.player-name').textContent}`;
              rankingTitle.classList.add('title-winner-announced');
            }
            
            // 以前のスクロール処理を削除（最初に移動済み）
            // 全ての演出は最初のスクロール後に表示される
            
          }, delay + 1200);
        }
      }, delay);
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
        
        // 一時的なリスナーを使用して一度だけプレイヤー一覧を取得
        const unsubscribe = playersCollection.onSnapshot(async snapshot => {
          // 即座にリスナーを解除
          unsubscribe();
          
          if (snapshot.empty) {
            updateGameStatus('付与対象のプレイヤーがいません');
            return;
          }
          
          // 各プレイヤーにポイントを付与
          const batch = db.batch();
          let playerCount = 0;
          
          snapshot.forEach(doc => {
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
        }, error => {
          console.error('プレイヤーデータ取得エラー:', error);
          updateGameStatus('プレイヤーデータの取得に失敗しました');
        });
        
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
        
        // リターン値を保持する変数
        let sessionRestored = false;
        
        // onSnapshotを使用して一回限りのリスナーを設定
        const unsubscribe = playersCollection.doc(savedPlayer.id).onSnapshot(doc => {
          // 即座にリスナーを解除（一回だけ取得）
          unsubscribe();
          
          // セッション復元処理
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
            playersCollection.doc(savedPlayer.id).update({
              isActive: true,
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
              // プレイヤー表示を同期
              syncPlayerDisplay();
              
              // プレイヤー画面に遷移
              showScreen('player-panel');
              
              // ポイントのリアルタイムリスナーを開始
              startPlayerPointsListener();
              
              console.log('プレイヤーセッションを自動復元しました:', currentPlayer.name);
            }).catch(error => {
              console.error('プレイヤー情報の更新に失敗:', error);
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
            playersCollection.doc(savedPlayer.id).set(currentPlayer).then(() => {
              // プレイヤー表示を同期
              syncPlayerDisplay();
              
              // プレイヤー画面に遷移
              showScreen('player-panel');
              
              // ポイントのリアルタイムリスナーを開始
              startPlayerPointsListener();
              
              console.log('新規プレイヤー情報を作成して自動復元しました:', currentPlayer.name);
            }).catch(error => {
              console.error('新規プレイヤー情報の作成に失敗:', error);
            });
          }
        }, error => {
          console.error('プレイヤー情報取得エラー:', error);
          // エラー時は登録画面のままにする
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

    // 画像のプリロード関数（進捗表示付き）
    function preloadImage(url) {
      return new Promise((resolve, reject) => {
        // ローディングコンテナとプログレスバーの要素を取得
        const loadingContainer = document.getElementById('loading-container');
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = loadingContainer.querySelector('.loading-text');
        
        // ローディングバーを表示
        if (loadingContainer) {
          loadingContainer.classList.add('show');
          loadingProgress.style.width = '0%';
          loadingText.textContent = '画像ロード中...';
        }
        
        // XMLHttpRequestを使って進捗を取得
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        
        // 進捗イベント
        xhr.onprogress = function(event) {
          if (event.lengthComputable && loadingProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            loadingProgress.style.width = percentComplete + '%';
            if (loadingText) {
              loadingText.textContent = `画像ロード中... ${Math.round(percentComplete)}%`;
            }
          }
        };
        
        // ロード完了
        xhr.onload = function() {
          if (xhr.status === 200) {
            // 一時的なオブジェクトURLを作成（表示はしない）
            const blob = xhr.response;
            const objectUrl = URL.createObjectURL(blob);
            
            // 画像のプリロード
            const img = new Image();
            img.onload = function() {
              // ローディング完了表示
              if (loadingProgress) {
                loadingProgress.style.width = '100%';
              }
              if (loadingContainer) {
                loadingContainer.classList.add('load-complete');
              }
              if (loadingText) {
                loadingText.textContent = 'ロード完了！ゲーム開始をお待ちください';
              }
              
              // 少し待ってからローディングバーを非表示
              setTimeout(() => {
                if (loadingContainer) {
                  loadingContainer.classList.remove('show');
                  // ローディング完了クラスをリセット
                  setTimeout(() => {
                    loadingContainer.classList.remove('load-complete');
                  }, 300);
                }
              }, 1500);
              
              // オブジェクトURLを解放
              URL.revokeObjectURL(objectUrl);
              resolve(url);
            };
            
            img.onerror = function() {
              if (loadingContainer) {
                loadingContainer.classList.remove('show');
              }
              reject(new Error(`画像のプリロードに失敗: ${url}`));
            };
            
            img.src = objectUrl;
          } else {
            if (loadingContainer) {
              loadingContainer.classList.remove('show');
            }
            reject(new Error(`画像のダウンロードに失敗: ${xhr.status}`));
          }
        };
        
        // エラー発生時
        xhr.onerror = function() {
          if (loadingContainer) {
            loadingContainer.classList.remove('show');
          }
          reject(new Error('ネットワークエラーが発生しました'));
        };
        
        // リクエスト送信
        xhr.send();
      });
    }
    
    // ゲーム準備ボタンのイベントリスナー
    const prepareGameBtn = document.getElementById('prepare-game');
    prepareGameBtn.addEventListener('click', async () => {
      try {
        // 現在選択されているステージを取得
        const stageSelector = document.getElementById('stage-selector');
        const selectedStageId = stageSelector.value;
        const selectedStage = STAGES[selectedStageId];
        
        if (!selectedStage) {
          console.error('ステージが選択されていません');
          updateGameStatus('ステージを選択してください');
          return;
        }
        
        // ゲーム状態を準備中に設定
        const gameState = createGameState(false, selectedStage);
        gameState.isPreparing = true; // 準備中フラグをオン
        
        // Firestoreに保存
        await gameStateCollection.doc('current').set(gameState);
        
        updateGameStatus(`ステージ「${selectedStage.name}」の準備を開始しました。プレイヤー端末で画像をプリロード中...`);
        console.log('ゲーム準備状態を保存しました:', gameState);
        
      } catch (error) {
        console.error('ゲーム準備エラー:', error);
        updateGameStatus('ゲーム準備に失敗しました');
      }
    });
    
    // マスター側：正解表示ボタンのイベントハンドラ
    showAnswerBtn.addEventListener('click', async () => {
      try {
        console.log('正解表示ボタンがクリックされました');
        // 現在のゲーム状態を取得
        const gameStateDoc = await gameStateCollection.doc('current').get();
        
        if (gameStateDoc.exists) {
          const gameState = gameStateDoc.data();
          
          // ゲームが開始されていない場合は処理をしない
          if (!gameState.gameStarted) {
            updateGameStatus('ゲームが開始されていません。まずゲームを開始してください。');
            return;
          }
          
          // 正解表示フラグを切り替え
          const showAnswer = !gameState.showAnswer;
          
          // 正解画像のパスを確認・生成
          let answerImagePath = gameState.answerImagePath;
          if (!answerImagePath && gameState.stageId) {
            const stageNumber = gameState.stageId.replace('stage', '');
            answerImagePath = `images/answers/answer${stageNumber}.png`;
          }
          
          // 更新データを準備
          const updateData = {
            showAnswer: showAnswer
          };
          
          // 正解画像パスがない場合は追加
          if (!gameState.answerImagePath && answerImagePath) {
            updateData.answerImagePath = answerImagePath;
          }
          
          // 正解を表示する場合は、すべてのプレイヤーの解答入力を禁止するフラグを追加
          if (showAnswer) {
            updateData.blockAllAnswers = true;
            updateGameStatus('正解を表示しました。すべてのプレイヤーの解答入力が無効になりました。');
          } else {
            updateData.blockAllAnswers = false;
            updateGameStatus('正解表示を非表示にしました。未回答のプレイヤーは再び解答できます。');
          }
          
          // Firebaseのゲーム状態を更新
          await gameStateCollection.doc('current').update(updateData);
          
          console.log('正解表示状態を更新しました:', showAnswer, '正解画像パス:', answerImagePath);
        }
      } catch (error) {
        console.error('正解表示エラー:', error);
        updateGameStatus('正解表示の更新に失敗しました: ' + error.message);
      }
    });

  } catch (error) {
    console.error("App initialization error:", error);
    alert("アプリケーションエラー: " + error.message);
  }
}); 