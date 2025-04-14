// プレイヤー関連の機能
const playerUtils = {
  // ローカルストレージキー
  STORAGE_KEY: 'puzzle_game_player',
  
  // 現在のプレイヤー
  currentPlayer: null,
  
  // プレイヤー状態変更時のコールバック関数
  listeners: [],
  
  // プレイヤー状態の変更を監視
  onPlayerStateChanged(callback) {
    this.listeners.push(callback);
    
    // 既存のプレイヤー情報があれば即時実行
    if (this.currentPlayer) {
      callback({
        isActive: true,
        player: this.currentPlayer
      });
    } else {
      callback({
        isActive: false,
        player: null
      });
    }
    
    // 登録解除用の関数を返す
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  // リスナーに通知
  notifyListeners() {
    const playerState = this.currentPlayer 
      ? { isActive: true, player: this.currentPlayer }
      : { isActive: false, player: null };
    
    this.listeners.forEach(callback => callback(playerState));
  },
  
  // ローカルストレージからプレイヤー情報を読み込む
  loadFromStorage() {
    try {
      const savedPlayer = localStorage.getItem(this.STORAGE_KEY);
      if (savedPlayer) {
        this.currentPlayer = JSON.parse(savedPlayer);
        this.notifyListeners();
        return this.currentPlayer;
      }
    } catch (error) {
      console.error('プレイヤー情報の読み込みに失敗しました', error);
    }
    return null;
  },
  
  // ローカルストレージにプレイヤー情報を保存
  saveToStorage() {
    try {
      if (this.currentPlayer) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentPlayer));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('プレイヤー情報の保存に失敗しました', error);
    }
  },
  
  // 名前でプレイヤーを登録/取得
  async registerPlayer(name) {
    if (!name || name.trim() === '') {
      throw new Error('名前を入力してください');
    }
    
    try {
      // 名前でプレイヤーを検索
      const snapshot = await firebaseUtils.db.collection('participants')
        .where('name', '==', name.trim())
        .limit(1)
        .get();
      
      let playerId;
      let playerData;
      
      if (snapshot.empty) {
        // 新規プレイヤーの場合は登録
        const playerRef = firebaseUtils.db.collection('participants').doc();
        playerId = playerRef.id;
        
        playerData = {
          id: playerId,
          name: name.trim(),
          totalPoints: 100, // 初期ポイント
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await playerRef.set(playerData);
        
        // 初期ポイント履歴の登録
        await firebaseUtils.db.collection('pointHistory').add({
          userId: playerId,
          points: 100,
          reason: '参加ボーナス',
          previousTotal: 0,
          newTotal: 100,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // 既存プレイヤーの場合はデータを取得
        const playerDoc = snapshot.docs[0];
        playerId = playerDoc.id;
        playerData = playerDoc.data();
        playerData.id = playerId;
      }
      
      // 現在のプレイヤーとして設定
      this.currentPlayer = playerData;
      this.saveToStorage();
      this.notifyListeners();
      
      return {
        success: true,
        player: playerData
      };
    } catch (error) {
      console.error('プレイヤー登録に失敗しました', error);
      return {
        success: false,
        error: 'プレイヤー登録に失敗しました: ' + error.message
      };
    }
  },
  
  // プレイヤー情報の更新
  async updatePlayerData() {
    if (!this.currentPlayer || !this.currentPlayer.id) return null;
    
    try {
      const playerDoc = await firebaseUtils.db.collection('participants')
        .doc(this.currentPlayer.id)
        .get();
      
      if (playerDoc.exists) {
        const playerData = playerDoc.data();
        playerData.id = playerDoc.id;
        
        // 現在のプレイヤー情報を更新
        this.currentPlayer = playerData;
        this.saveToStorage();
        this.notifyListeners();
        
        return playerData;
      }
      
      return null;
    } catch (error) {
      console.error('プレイヤー情報の更新に失敗しました', error);
      return null;
    }
  },
  
  // ログアウト（プレイヤー情報をクリア）
  logout() {
    this.currentPlayer = null;
    this.saveToStorage();
    this.notifyListeners();
    return { success: true };
  },
  
  // プレイヤー情報の取得
  getPlayerProfile(playerId) {
    return firebaseUtils.db.collection('participants')
      .doc(playerId)
      .get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          data.id = doc.id;
          return data;
        }
        return null;
      })
      .catch(error => {
        console.error('プレイヤープロフィールの取得に失敗しました', error);
        return null;
      });
  }
};

// 初期化時にローカルストレージからプレイヤー情報を読み込む
document.addEventListener('DOMContentLoaded', () => {
  playerUtils.loadFromStorage();
});

// グローバルスコープで利用可能にする
window.playerUtils = playerUtils; 