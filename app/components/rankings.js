// ランキング関連の機能
const rankingsComponent = {
  // 要素への参照
  elements: {
    rankingsList: document.getElementById('rankings-list')
  },
  
  // 現在のプレイヤー情報
  currentPlayer: null,
  
  // ランキング更新間隔（ミリ秒）
  updateInterval: 30000, // 30秒
  
  // 更新用タイマー
  updateTimer: null,
  
  // 初期化
  init() {
    this.setupPlayerStateListener();
  },
  
  // プレイヤー状態リスナーの設定
  setupPlayerStateListener() {
    playerUtils.onPlayerStateChanged(async (playerState) => {
      this.currentPlayer = playerState.player;
      
      if (playerState.isActive) {
        // 初期ランキング読み込み
        await this.loadRankings();
        
        // リアルタイム更新リスナーを設定
        this.setupRankingsListener();
        
        // 定期的な更新タイマーを設定
        this.startAutoUpdate();
      } else {
        // タイマーをクリア
        this.stopAutoUpdate();
      }
    });
  },
  
  // ランキングデータの読み込み
  async loadRankings() {
    if (!this.elements.rankingsList) return;
    
    try {
      const rankings = await firebaseUtils.getRankings();
      
      // リストをクリア
      this.elements.rankingsList.innerHTML = '';
      
      // ランキングがない場合
      if (rankings.length === 0) {
        this.elements.rankingsList.innerHTML = '<li>ランキングデータがありません</li>';
        return;
      }
      
      // 各ランキングを表示
      rankings.forEach(player => {
        const li = document.createElement('li');
        
        // 自分自身の場合はハイライト
        const isCurrentPlayer = this.currentPlayer && 
                               player.id === this.currentPlayer.id;
        
        li.className = isCurrentPlayer ? 'current-user' : '';
        
        li.innerHTML = `
          <span class="ranking-position">${player.rank}位</span>
          <span class="ranking-player">${player.name || 'ゲスト'}</span>
          <span class="ranking-points">${player.totalPoints || 0} pts</span>
        `;
        
        this.elements.rankingsList.appendChild(li);
      });
    } catch (error) {
      console.error('ランキングの読み込みに失敗しました', error);
      console.log('ランキングの読み込みに失敗しました');
    }
  },
  
  // リアルタイム更新リスナーの設定
  setupRankingsListener() {
    // top5の参加者に対してリアルタイムリスナー
    firebaseUtils.db.collection('participants')
      .orderBy('totalPoints', 'desc')
      .limit(5)
      .onSnapshot(snapshot => {
        // 変更があった場合にのみ更新
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          this.loadRankings();
        }
      }, error => {
        console.error('ランキング監視でエラーが発生しました', error);
      });
    
    // 自分自身の順位変動を監視（自分が上位5名に入っていない場合）
    if (this.currentPlayer && this.currentPlayer.id) {
      firebaseUtils.db.collection('participants')
        .doc(this.currentPlayer.id)
        .onSnapshot(doc => {
          if (doc.exists) {
            // 自分のポイントが変わった場合、ランキングを再読み込み
            this.loadRankings();
          }
        }, error => {
          console.error('プレイヤーデータ監視でエラーが発生しました', error);
        });
    }
  },
  
  // 自動更新の開始
  startAutoUpdate() {
    // 既存のタイマーをクリア
    this.stopAutoUpdate();
    
    // 新しいタイマーを設定
    this.updateTimer = setInterval(() => {
      this.loadRankings();
    }, this.updateInterval);
  },
  
  // 自動更新の停止
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
};

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  rankingsComponent.init();
}); 