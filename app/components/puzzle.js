// 謎解きゲーム関連の機能
const puzzleComponent = {
  // 要素への参照
  elements: {
    puzzleContainer: document.getElementById('puzzle-container'),
    puzzleContent: document.getElementById('puzzle-content'),
    puzzleInput: document.getElementById('puzzle-input'),
    answerForm: document.getElementById('answer-form'),
    gameStatus: document.getElementById('game-status'),
    timer: document.getElementById('timer'),
    hintsShop: document.getElementById('hints-shop'),
    availableHints: document.getElementById('available-hints')
  },
  
  // 現在のプレイヤー情報
  currentPlayer: null,
  
  // 現在のパズル情報
  currentPuzzle: null,
  
  // タイマー関連
  timerInterval: null,
  endTime: null,
  
  // 初期化
  init() {
    this.setupEventListeners();
    this.setupPlayerStateListener();
  },
  
  // イベントリスナーのセットアップ
  setupEventListeners() {
    // 解答フォームの送信
    this.elements.answerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAnswer();
    });
  },
  
  // プレイヤー状態リスナーの設定
  setupPlayerStateListener() {
    playerUtils.onPlayerStateChanged(async (playerState) => {
      this.currentPlayer = playerState.player;
      
      if (playerState.isActive && playerState.player) {
        // アクティブな謎解き問題を取得
        await this.loadActivePuzzle();
        
        // パズルのリアルタイム更新リスナーを設定
        this.setupPuzzleListener();
      }
    });
  },
  
  // アクティブな謎解き問題の読み込み
  async loadActivePuzzle() {
    try {
      const puzzle = await firebaseUtils.getActivePuzzle();
      
      if (puzzle) {
        this.currentPuzzle = puzzle;
        this.updatePuzzleDisplay(puzzle);
        
        // タイマー設定
        if (puzzle.endTime) {
          this.startTimer(puzzle.endTime.toDate());
        }
        
        // ヒント表示
        await this.loadPuzzleHints(puzzle.id);
      } else {
        // アクティブな問題がない場合
        this.showWaitingState();
      }
    } catch (error) {
      console.error('謎解き問題の読み込みに失敗しました', error);
      dashboardComponent.showNotification('謎解き問題の読み込みに失敗しました', 'error');
    }
  },
  
  // パズルのリアルタイム更新リスナー
  setupPuzzleListener() {
    // アクティブなパズルのリスナー
    firebaseUtils.db.collection('puzzles')
      .where('status', '==', 'active')
      .onSnapshot(snapshot => {
        // 変更があった場合
        const changes = snapshot.docChanges();
        
        for (const change of changes) {
          if (change.type === 'added' || change.type === 'modified') {
            const puzzle = {
              id: change.doc.id,
              ...change.doc.data()
            };
            
            // 現在のパズルと異なる場合のみ更新
            if (!this.currentPuzzle || this.currentPuzzle.id !== puzzle.id) {
              this.currentPuzzle = puzzle;
              this.updatePuzzleDisplay(puzzle);
              
              // タイマー再設定
              this.clearTimer();
              if (puzzle.endTime) {
                this.startTimer(puzzle.endTime.toDate());
              }
              
              // ヒント再読み込み
              this.loadPuzzleHints(puzzle.id);
            }
          } else if (change.type === 'removed') {
            // アクティブな問題が削除された場合
            if (this.currentPuzzle && this.currentPuzzle.id === change.doc.id) {
              this.currentPuzzle = null;
              this.showWaitingState();
              this.clearTimer();
            }
          }
        }
      }, error => {
        console.error('パズル監視でエラーが発生しました', error);
      });
  },
  
  // パズル表示の更新
  updatePuzzleDisplay(puzzle) {
    if (!this.elements.puzzleContent || !this.elements.gameStatus || !this.elements.puzzleInput) return;
    
    // ゲーム状態の更新
    this.elements.gameStatus.textContent = 'アクティブ';
    
    // 問題文の表示
    this.elements.puzzleContent.innerHTML = `
      <h3>${puzzle.title || '謎解き問題'}</h3>
      <div class="puzzle-description">${puzzle.description || '説明がありません'}</div>
      <div class="puzzle-question">${puzzle.question || '問題がありません'}</div>
    `;
    
    // 画像がある場合は表示
    if (puzzle.imageUrl) {
      const img = document.createElement('img');
      img.src = puzzle.imageUrl;
      img.alt = '謎解き問題の画像';
      img.className = 'puzzle-image';
      this.elements.puzzleContent.appendChild(img);
    }
    
    // 解答欄の表示
    this.elements.puzzleInput.style.display = 'block';
    
    // ヒントショップの表示
    if (this.elements.hintsShop) {
      this.elements.hintsShop.style.display = 'block';
    }
  },
  
  // 待機状態の表示
  showWaitingState() {
    if (!this.elements.puzzleContent || !this.elements.gameStatus || !this.elements.puzzleInput) return;
    
    this.elements.gameStatus.textContent = '準備中';
    this.elements.puzzleContent.innerHTML = '<p>ゲームが始まるのをお待ちください...</p>';
    this.elements.puzzleInput.style.display = 'none';
    
    if (this.elements.hintsShop) {
      this.elements.hintsShop.style.display = 'none';
    }
    
    if (this.elements.timer) {
      this.elements.timer.textContent = '--:--';
    }
  },
  
  // タイマーの開始
  startTimer(endTime) {
    this.endTime = endTime;
    
    // 既存のタイマーをクリア
    this.clearTimer();
    
    // タイマー更新関数
    const updateTimer = () => {
      const now = new Date();
      const remaining = this.endTime - now;
      
      if (remaining <= 0) {
        // タイマー終了
        this.clearTimer();
        if (this.elements.timer) {
          this.elements.timer.textContent = '00:00';
        }
        dashboardComponent.showNotification('制限時間が終了しました', 'info');
        return;
      }
      
      // 残り時間の計算と表示
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      if (this.elements.timer) {
        this.elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    };
    
    // 初回更新
    updateTimer();
    
    // 1秒ごとに更新
    this.timerInterval = setInterval(updateTimer, 1000);
  },
  
  // タイマーのクリア
  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },
  
  // ヒント一覧の読み込み
  async loadPuzzleHints(puzzleId) {
    if (!this.elements.availableHints || !puzzleId) return;
    
    try {
      const hints = await firebaseUtils.getPuzzleHints(puzzleId);
      
      // ヒント一覧をクリア
      this.elements.availableHints.innerHTML = '';
      
      // ヒントがない場合
      if (hints.length === 0) {
        this.elements.availableHints.innerHTML = '<p>利用可能なヒントはありません</p>';
        return;
      }
      
      // 購入済みヒントを取得
      const purchasedHints = await this.getPurchasedHints(puzzleId);
      
      // 各ヒントを表示
      hints.forEach(hint => {
        const isPurchased = purchasedHints.includes(hint.id);
        
        const hintCard = document.createElement('div');
        hintCard.className = `hint-card ${isPurchased ? 'purchased' : ''}`;
        hintCard.dataset.hintId = hint.id;
        
        if (isPurchased) {
          // 購入済みの場合、ヒント内容を表示
          hintCard.innerHTML = `
            <h4>${hint.title}</h4>
            <p class="hint-content">${hint.content}</p>
            <p><small>購入済み</small></p>
          `;
        } else {
          // 未購入の場合、購入ボタンを表示
          hintCard.innerHTML = `
            <h4>${hint.title}</h4>
            <p>ヒントを購入する</p>
            <p class="hint-cost">${hint.cost}ポイント</p>
            <button class="buy-hint-button">購入</button>
          `;
          
          // 購入ボタンのイベント設定
          const buyButton = hintCard.querySelector('.buy-hint-button');
          buyButton?.addEventListener('click', async () => {
            await this.purchaseHint(puzzleId, hint.id);
          });
        }
        
        this.elements.availableHints.appendChild(hintCard);
      });
    } catch (error) {
      console.error('ヒント一覧の読み込みに失敗しました', error);
      dashboardComponent.showNotification('ヒント一覧の読み込みに失敗しました', 'error');
    }
  },
  
  // 購入済みヒントの取得
  async getPurchasedHints(puzzleId) {
    if (!this.currentPlayer || !this.currentPlayer.id) return [];
    
    try {
      const snapshot = await firebaseUtils.db.collection('hintPurchases')
        .where('userId', '==', this.currentPlayer.id)
        .where('puzzleId', '==', puzzleId)
        .get();
      
      return snapshot.docs.map(doc => doc.data().hintId);
    } catch (error) {
      console.error('購入済みヒントの取得に失敗しました', error);
      return [];
    }
  },
  
  // ヒントの購入
  async purchaseHint(puzzleId, hintId) {
    if (!this.currentPlayer || !this.currentPlayer.id) {
      dashboardComponent.showNotification('ゲームに参加してください', 'error');
      return;
    }
    
    try {
      // 購入確認
      const hintDoc = await firebaseUtils.db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .doc(hintId)
        .get();
      
      if (!hintDoc.exists) {
        dashboardComponent.showNotification('ヒントが存在しません', 'error');
        return;
      }
      
      const hintData = hintDoc.data();
      
      if (!confirm(`「${hintData.title}」を${hintData.cost}ポイントで購入しますか？`)) {
        return;
      }
      
      // ヒント購入処理
      const result = await firebaseUtils.purchaseHint(
        this.currentPlayer.id,
        puzzleId,
        hintId
      );
      
      // 成功時の処理
      if (result) {
        dashboardComponent.showNotification('ヒントを購入しました', 'success');
        
        // プレイヤー情報を更新
        await playerUtils.updatePlayerData();
        
        // ダッシュボードのポイント表示を更新
        if (dashboardComponent.elements.totalPoints) {
          dashboardComponent.elements.totalPoints.textContent = result.newTotal;
        }
        
        // ヒント一覧を再読み込み
        await this.loadPuzzleHints(puzzleId);
      }
    } catch (error) {
      console.error('ヒント購入に失敗しました', error);
      
      let errorMessage = 'ヒント購入に失敗しました';
      if (error.message === 'ポイントが不足しています') {
        errorMessage = 'ポイントが不足しています';
      }
      
      dashboardComponent.showNotification(errorMessage, 'error');
    }
  },
  
  // 解答の送信
  async handleAnswer() {
    if (!this.currentPlayer || !this.currentPlayer.id || !this.currentPuzzle) {
      dashboardComponent.showNotification('解答を送信できません', 'error');
      return;
    }
    
    const answerInput = document.getElementById('answer');
    if (!answerInput) return;
    
    const answer = answerInput.value.trim();
    
    if (!answer) {
      dashboardComponent.showNotification('解答を入力してください', 'error');
      return;
    }
    
    try {
      // 解答を記録
      await firebaseUtils.db.collection('answers').add({
        userId: this.currentPlayer.id,
        puzzleId: this.currentPuzzle.id,
        answer: answer,
        correct: answer.toLowerCase() === (this.currentPuzzle.answer || '').toLowerCase(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // 正解判定
      if (answer.toLowerCase() === (this.currentPuzzle.answer || '').toLowerCase()) {
        dashboardComponent.showNotification('正解です！', 'success');
        
        // 正解ポイントの加算
        const pointReward = this.currentPuzzle.pointReward || 100;
        const newTotal = await firebaseUtils.updatePoints(
          this.currentPlayer.id,
          pointReward,
          '謎解き正解ボーナス'
        );
        
        // プレイヤー情報を更新
        await playerUtils.updatePlayerData();
        
        // ポイント表示の更新
        if (dashboardComponent.elements.totalPoints) {
          dashboardComponent.elements.totalPoints.textContent = newTotal;
        }
        
        // 入力欄をクリア
        answerInput.value = '';
      } else {
        dashboardComponent.showNotification('不正解です。もう一度考えてみましょう', 'error');
      }
    } catch (error) {
      console.error('解答送信に失敗しました', error);
      dashboardComponent.showNotification('解答送信に失敗しました', 'error');
    }
  }
};

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  puzzleComponent.init();
}); 