// 賭け投票関連の機能
const bettingComponent = {
  // 要素への参照
  elements: {
    bettingContainer: document.getElementById('betting-container'),
    bettingForm: document.getElementById('betting-form'),
    bettingTarget: document.getElementById('betting-target'),
    bettingPoints: document.getElementById('betting-points'),
    betsList: document.getElementById('bets-list')
  },
  
  // 現在のプレイヤー情報
  currentPlayer: null,
  
  // 初期化
  init() {
    this.setupEventListeners();
    this.setupPlayerStateListener();
  },
  
  // イベントリスナーのセットアップ
  setupEventListeners() {
    // 賭けフォームの送信
    this.elements.bettingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handlePlaceBet();
    });
  },
  
  // プレイヤー状態リスナーの設定
  setupPlayerStateListener() {
    playerUtils.onPlayerStateChanged(async (playerState) => {
      this.currentPlayer = playerState.player;
      
      if (playerState.isActive && playerState.player) {
        // 賭け対象のプレイヤーリストを読み込む
        await this.loadBettingTargets();
        
        // プレイヤーの現在の賭け一覧を読み込む
        await this.loadUserBets();
      }
    });
  },
  
  // 賭け対象プレイヤーリストの読み込み
  async loadBettingTargets() {
    if (!this.elements.bettingTarget) return;
    
    try {
      const snapshot = await firebaseUtils.db.collection('participants').get();
      
      // 選択肢をクリア
      this.elements.bettingTarget.innerHTML = '';
      
      // プレイヤーがいない場合のデフォルトオプション
      if (snapshot.empty) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '対象者がいません';
        this.elements.bettingTarget.appendChild(option);
        return;
      }
      
      // 各プレイヤーを選択肢として追加
      snapshot.forEach(doc => {
        const userData = doc.data();
        
        // 自分自身は除外
        if (this.currentPlayer && doc.id === this.currentPlayer.id) return;
        
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = userData.name || 'ゲスト';
        this.elements.bettingTarget.appendChild(option);
      });
    } catch (error) {
      console.error('賭け対象の読み込みに失敗しました', error);
      dashboardComponent.showNotification('賭け対象の読み込みに失敗しました', 'error');
    }
  },
  
  // プレイヤーの賭け一覧の読み込み
  async loadUserBets() {
    if (!this.currentPlayer || !this.currentPlayer.id || !this.elements.betsList) return;
    
    try {
      const bets = await firebaseUtils.getUserBets(this.currentPlayer.id);
      
      // リストをクリア
      this.elements.betsList.innerHTML = '';
      
      // 賭けがない場合のメッセージ
      if (bets.length === 0) {
        this.elements.betsList.innerHTML = '<li>現在の賭けはありません</li>';
        return;
      }
      
      // 各賭けを表示
      for (const bet of bets) {
        // 賭けターゲットのプレイヤー情報を取得
        const targetDoc = await firebaseUtils.db.collection('participants').doc(bet.targetId).get();
        const targetName = targetDoc.exists ? targetDoc.data().name : '不明なプレイヤー';
        
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="bet-item">
            <div class="bet-info">
              <span class="bet-target">${targetName}</span>に
              <span class="bet-points">${bet.points}</span>ポイント賭け中
            </div>
            <div class="bet-date">
              ${this.formatDate(bet.createdAt?.toDate())}
            </div>
            <div class="bet-status">
              状態: <span class="${bet.status}">${this.getBetStatusText(bet.status)}</span>
            </div>
          </div>
        `;
        
        this.elements.betsList.appendChild(li);
      }
    } catch (error) {
      console.error('賭け一覧の読み込みに失敗しました', error);
      dashboardComponent.showNotification('賭け一覧の読み込みに失敗しました', 'error');
    }
  },
  
  // 賭けの実行
  async handlePlaceBet() {
    if (!this.currentPlayer || !this.currentPlayer.id) {
      dashboardComponent.showNotification('ゲームに参加してください', 'error');
      return;
    }
    
    if (!this.elements.bettingTarget || !this.elements.bettingPoints) return;
    
    const targetId = this.elements.bettingTarget.value;
    const points = parseInt(this.elements.bettingPoints.value, 10);
    
    if (!targetId) {
      dashboardComponent.showNotification('賭け対象を選択してください', 'error');
      return;
    }
    
    if (isNaN(points) || points <= 0) {
      dashboardComponent.showNotification('有効なポイント数を入力してください', 'error');
      return;
    }
    
    try {
      // 対象プレイヤーの情報を取得
      const targetDoc = await firebaseUtils.db.collection('participants').doc(targetId).get();
      
      if (!targetDoc.exists) {
        dashboardComponent.showNotification('選択したプレイヤーが見つかりません', 'error');
        return;
      }
      
      const targetName = targetDoc.data().name || '不明なプレイヤー';
      
      // 賭けデータを作成
      const betData = {
        targetId: targetId,
        target: targetName,
        points: points,
        type: 'winner_prediction', // 賭けの種類
        odds: 2.0, // オッズ（還元率）
      };
      
      // 確認ダイアログを表示
      if (!confirm(`${targetName}さんに${points}ポイント賭けますか？`)) {
        return;
      }
      
      // 賭けを実行
      const result = await firebaseUtils.placeBet(this.currentPlayer.id, betData);
      
      if (result) {
        dashboardComponent.showNotification('賭けを登録しました', 'success');
        
        // プレイヤー情報を更新
        await playerUtils.updatePlayerData();
        
        // ダッシュボードのポイント表示を更新
        if (dashboardComponent.elements.totalPoints) {
          dashboardComponent.elements.totalPoints.textContent = result.newTotal;
        }
        
        // フォームをリセット
        this.elements.bettingPoints.value = 1;
        
        // 賭け一覧を再読み込み
        await this.loadUserBets();
      }
    } catch (error) {
      console.error('賭けの登録に失敗しました', error);
      
      let errorMessage = '賭けの登録に失敗しました';
      if (error.message === 'ポイントが不足しています') {
        errorMessage = 'ポイントが不足しています';
      }
      
      dashboardComponent.showNotification(errorMessage, 'error');
    }
  },
  
  // 日付のフォーマット
  formatDate(date) {
    if (!date) return '日時不明';
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('ja-JP', options);
  },
  
  // 賭けの状態テキスト
  getBetStatusText(status) {
    switch (status) {
      case 'active':
        return '進行中';
      case 'won':
        return '的中';
      case 'lost':
        return '外れ';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  }
};

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  bettingComponent.init();
}); 