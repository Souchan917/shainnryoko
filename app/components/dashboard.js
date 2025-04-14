// ダッシュボード関連の機能
const dashboardComponent = {
  // 要素への参照
  elements: {
    playerNameContainer: document.getElementById('player-name-container'),
    dashboardContainer: document.getElementById('dashboard'),
    userInfo: document.getElementById('user-info'),
    playerNameDisplay: document.getElementById('player-name-display'),
    totalPoints: document.getElementById('total-points'),
    playerNameForm: document.getElementById('player-name-form'),
    logoutButton: document.getElementById('logout-button'),
    rankingsList: document.getElementById('rankings-list'),
    betsList: document.getElementById('bets-list'),
    puzzleContent: document.getElementById('puzzle-content'),
    puzzleStatus: document.getElementById('game-status'),
    timer: document.getElementById('timer')
  },

  // 現在のプレイヤー情報
  currentPlayer: null,
  
  // 購読解除用のリスナー
  unsubscribers: {},
  
  // 初期化
  init() {
    this.setupEventListeners();
    this.setupPlayerStateListener();
  },
  
  // イベントリスナーのセットアップ
  setupEventListeners() {
    // プレイヤー名フォームの送信
    this.elements.playerNameForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handlePlayerRegistration();
    });
    
    // ログアウトボタンのイベント設定
    this.elements.logoutButton?.addEventListener('click', () => {
      this.handleLogout();
    });
  },
  
  // プレイヤー状態リスナーのセットアップ
  setupPlayerStateListener() {
    playerUtils.onPlayerStateChanged((state) => {
      if (state.isActive) {
        this.currentPlayer = state.player;
        this.showDashboard();
        this.updatePlayerInfo();
        this.setupRealtimeSubscriptions();
      } else {
        this.cleanup();
        this.showPlayerNameForm();
      }
    });
  },
  
  // リアルタイム購読のセットアップ
  setupRealtimeSubscriptions() {
    if (!this.currentPlayer || !this.currentPlayer.id) return;
    
    // クリーンアップ（既存の購読を解除）
    this.cleanup();
    
    // プレイヤー情報のリアルタイム更新を購読
    this.unsubscribers.player = firebaseUtils.subscribeToPlayer(
      this.currentPlayer.id, 
      (result) => {
        if (result.success) {
          this.currentPlayer = result.data;
          this.updatePlayerInfo();
          
          // プレイヤーオブジェクトを更新
          playerUtils.currentPlayer = this.currentPlayer;
          playerUtils.saveToStorage();
        }
      }
    );
    
    // ランキングのリアルタイム更新を購読
    this.unsubscribers.rankings = firebaseUtils.subscribeToRankings(
      (result) => {
        if (result.success) {
          this.updateRankings(result.data);
        }
      }
    );
    
    // ユーザーの賭け情報のリアルタイム更新を購読
    this.unsubscribers.userBets = firebaseUtils.subscribeToUserBets(
      this.currentPlayer.id,
      (result) => {
        if (result.success) {
          this.updateUserBets(result.data);
        }
      }
    );
    
    // ゲーム状態のリアルタイム更新を購読
    this.unsubscribers.gameState = firebaseUtils.subscribeToGameState(
      (result) => {
        if (result.success && result.data) {
          this.updateGameState(result.data);
        }
      }
    );
    
    // アクティブな謎解きのリアルタイム更新を購読
    this.unsubscribers.activePuzzle = firebaseUtils.subscribeToActivePuzzle(
      (result) => {
        if (result.success) {
          this.updateActivePuzzle(result.data);
        }
      }
    );
  },
  
  // 購読解除とクリーンアップ
  cleanup() {
    Object.values(this.unsubscribers).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    this.unsubscribers = {};
  },
  
  // プレイヤー名入力フォームの表示
  showPlayerNameForm() {
    if (!this.elements.playerNameContainer || !this.elements.dashboardContainer) return;
    
    this.elements.playerNameContainer.style.display = 'block';
    this.elements.dashboardContainer.style.display = 'none';
  },
  
  // ダッシュボードの表示
  showDashboard() {
    if (!this.elements.playerNameContainer || !this.elements.dashboardContainer) return;
    
    this.elements.playerNameContainer.style.display = 'none';
    this.elements.dashboardContainer.style.display = 'block';
  },
  
  // プレイヤー登録処理
  async handlePlayerRegistration() {
    const nameInput = document.getElementById('player-name-input');
    if (!nameInput) return;
    
    const playerName = nameInput.value.trim();
    if (!playerName) {
      this.showNotification('名前を入力してください', 'error');
      return;
    }
    
    try {
      const result = await playerUtils.registerPlayer(playerName);
      if (result.success) {
        this.currentPlayer = result.player;
        this.showDashboard();
        this.updatePlayerInfo();
        this.setupRealtimeSubscriptions();
      } else {
        this.showNotification(result.error, 'error');
      }
    } catch (error) {
      console.error('プレイヤー登録エラー:', error);
      this.showNotification('プレイヤー登録に失敗しました', 'error');
    }
  },
  
  // ログアウト処理
  handleLogout() {
    if (confirm('本当にログアウトしますか？')) {
      this.cleanup();
      playerUtils.logout();
      this.showPlayerNameForm();
    }
  },
  
  // プレイヤー情報の表示更新
  updatePlayerInfo() {
    if (!this.currentPlayer) return;
    
    if (this.elements.playerNameDisplay) {
      this.elements.playerNameDisplay.textContent = this.currentPlayer.name;
    }
    
    if (this.elements.totalPoints) {
      this.elements.totalPoints.textContent = this.currentPlayer.totalPoints || 0;
    }
    
    if (this.elements.userInfo) {
      this.elements.userInfo.innerHTML = `
        <span class="user-name">${this.currentPlayer.name}</span>
        (${this.currentPlayer.totalPoints || 0}ポイント)
      `;
    }
  },
  
  // ランキングの表示更新
  updateRankings(rankings) {
    if (!this.elements.rankingsList || !rankings) return;
    
    const html = rankings.map(player => `
      <li>
        <span class="ranking-player">${player.name}</span>
        <span class="ranking-points">${player.totalPoints || 0}</span>
      </li>
    `).join('');
    
    this.elements.rankingsList.innerHTML = html;
  },
  
  // ユーザーの賭け情報の表示更新
  updateUserBets(bets) {
    if (!this.elements.betsList || !bets) return;
    
    const html = bets.length > 0 
      ? bets.map(bet => `
        <li>
          <div><strong>${bet.target}</strong>に${bet.points}ポイント</div>
          <div class="bet-status">${this.getBetStatusText(bet.status)}</div>
        </li>
      `).join('')
      : '<li>現在の賭けはありません</li>';
    
    this.elements.betsList.innerHTML = html;
  },
  
  // ゲーム状態の表示更新
  updateGameState(state) {
    if (!state) return;
    
    // ゲームステータスの更新
    if (this.elements.puzzleStatus) {
      this.elements.puzzleStatus.textContent = state.statusText || '準備中';
    }
    
    // タイマーの更新
    if (this.elements.timer && state.timeRemaining) {
      this.elements.timer.textContent = this.formatTime(state.timeRemaining);
    }
  },
  
  // アクティブな謎解きの表示更新
  updateActivePuzzle(puzzle) {
    if (!this.elements.puzzleContent) return;
    
    if (puzzle) {
      this.elements.puzzleContent.innerHTML = `
        <h4>${puzzle.title || '問題'}</h4>
        <div class="puzzle-description">${puzzle.description || ''}</div>
        ${puzzle.imageUrl ? `<img src="${puzzle.imageUrl}" alt="問題画像" class="puzzle-image">` : ''}
      `;
      
      // 解答フォームの表示
      const puzzleInput = document.getElementById('puzzle-input');
      if (puzzleInput) {
        puzzleInput.style.display = 'block';
      }
      
      // ヒントショップの表示
      const hintsShop = document.getElementById('hints-shop');
      if (hintsShop) {
        hintsShop.style.display = 'block';
        
        // ヒント情報の取得と表示
        this.loadPuzzleHints(puzzle.id);
      }
    } else {
      this.elements.puzzleContent.innerHTML = '<p>現在アクティブな問題はありません。ゲームが始まるのをお待ちください...</p>';
      
      // 解答フォームとヒントショップを非表示
      const puzzleInput = document.getElementById('puzzle-input');
      if (puzzleInput) {
        puzzleInput.style.display = 'none';
      }
      
      const hintsShop = document.getElementById('hints-shop');
      if (hintsShop) {
        hintsShop.style.display = 'none';
      }
    }
  },
  
  // ヒント情報の取得と表示
  async loadPuzzleHints(puzzleId) {
    if (!puzzleId) return;
    
    const hintsContainer = document.getElementById('available-hints');
    if (!hintsContainer) return;
    
    try {
      const hints = await firebaseUtils.getPuzzleHints(puzzleId);
      
      if (hints.length > 0) {
        const html = hints.map(hint => `
          <div class="hint-card" data-hint-id="${hint.id}">
            <div class="hint-title">${hint.title || 'ヒント'}</div>
            <div class="hint-cost">${hint.cost || 0}ポイント</div>
          </div>
        `).join('');
        
        hintsContainer.innerHTML = html;
        
        // ヒントカードのクリックイベント
        const hintCards = hintsContainer.querySelectorAll('.hint-card');
        hintCards.forEach(card => {
          card.addEventListener('click', () => {
            this.handleHintPurchase(puzzleId, card.dataset.hintId);
          });
        });
      } else {
        hintsContainer.innerHTML = '<p>利用可能なヒントはありません</p>';
      }
    } catch (error) {
      console.error('ヒントの取得に失敗しました', error);
      hintsContainer.innerHTML = '<p>ヒントの読み込みに失敗しました</p>';
    }
  },
  
  // ヒント購入処理
  async handleHintPurchase(puzzleId, hintId) {
    if (!this.currentPlayer || !puzzleId || !hintId) return;
    
    try {
      // TODO: ヒント購入の実装
      console.log(`ヒント購入: プレイヤー=${this.currentPlayer.id}, 問題=${puzzleId}, ヒント=${hintId}`);
      
      // 仮実装: 本来はfirebaseUtils.purchaseHintなどを使用
      this.showNotification('ヒントを購入しました（仮実装）', 'success');
    } catch (error) {
      console.error('ヒント購入エラー:', error);
      this.showNotification('ヒントの購入に失敗しました', 'error');
    }
  },
  
  // 賭けの状態をテキストに変換
  getBetStatusText(status) {
    switch (status) {
      case 'active': return '進行中';
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  },
  
  // 時間のフォーマット (秒 -> MM:SS)
  formatTime(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  // 通知の表示
  showNotification(message, type = 'info') {
    app.showNotification(message, type);
  }
};

// DOMが読み込まれたらダッシュボードを初期化
document.addEventListener('DOMContentLoaded', () => {
  dashboardComponent.init();
}); 