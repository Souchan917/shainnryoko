// マスター管理機能
const masterComponent = {
  // マスターパスワード（実際の実装では環境変数やサーバーサイドで管理すべき）
  MASTER_PASSWORD: "puzzle2024",
  
  // マスター権限
  isMasterAuthenticated: false,
  
  // 要素への参照
  elements: {
    masterButton: document.getElementById('master-button'),
    masterDashboard: document.getElementById('master-dashboard'),
    playerNameContainer: document.getElementById('player-name-container'),
    dashboard: document.getElementById('dashboard'),
    masterAccessForm: document.getElementById('master-access-form'),
    masterPassword: document.getElementById('master-password'),
    masterLoginButton: document.getElementById('master-login-button'),
    masterControls: document.getElementById('master-controls'),
    gameStatusSelect: document.getElementById('game-status-select'),
    timeRemaining: document.getElementById('time-remaining'),
    updateGameStatusButton: document.getElementById('update-game-status'),
    puzzleTitle: document.getElementById('puzzle-title'),
    puzzleDescription: document.getElementById('puzzle-description'),
    puzzleImageUrl: document.getElementById('puzzle-image-url'),
    puzzleAnswer: document.getElementById('puzzle-answer'),
    createPuzzleButton: document.getElementById('create-puzzle'),
    hintTitle: document.getElementById('hint-title'),
    hintContent: document.getElementById('hint-content'),
    hintCost: document.getElementById('hint-cost'),
    addHintButton: document.getElementById('add-hint'),
    hintsList: document.getElementById('hints-list'),
    calculateResultsButton: document.getElementById('calculate-results'),
    resultsDisplay: document.getElementById('results-display')
  },
  
  // 現在のアクティブな謎解き問題ID
  activePuzzleId: null,
  
  // 初期化
  init() {
    this.setupEventListeners();
    this.checkMasterAuthState();
    this.checkActiveGame();
  },
  
  // イベントリスナーのセットアップ
  setupEventListeners() {
    // マスターボタンのクリックイベント
    this.elements.masterButton?.addEventListener('click', () => {
      this.showMasterDashboard();
    });
    
    // マスターログインボタンのクリックイベント
    this.elements.masterLoginButton?.addEventListener('click', () => {
      this.handleMasterLogin();
    });
    
    // マスターパスワード入力欄のエンターキー対応
    this.elements.masterPassword?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.handleMasterLogin();
      }
    });
    
    // ゲーム状態更新ボタンのクリックイベント
    this.elements.updateGameStatusButton?.addEventListener('click', () => {
      this.updateGameStatus();
    });
    
    // 問題作成/更新ボタンのクリックイベント
    this.elements.createPuzzleButton?.addEventListener('click', () => {
      this.createOrUpdatePuzzle();
    });
    
    // ヒント追加ボタンのクリックイベント
    this.elements.addHintButton?.addEventListener('click', () => {
      this.addHint();
    });
    
    // 結果計算ボタンのクリックイベント
    this.elements.calculateResultsButton?.addEventListener('click', () => {
      this.calculateResults();
    });
  },
  
  // マスター認証状態の確認
  checkMasterAuthState() {
    const authState = localStorage.getItem('master_auth');
    
    if (authState === 'true') {
      this.isMasterAuthenticated = true;
      this.elements.masterAccessForm.style.display = 'none';
      this.elements.masterControls.style.display = 'block';
    } else {
      this.isMasterAuthenticated = false;
      this.elements.masterAccessForm.style.display = 'block';
      this.elements.masterControls.style.display = 'none';
    }
  },
  
  // アクティブなゲーム状態の確認
  async checkActiveGame() {
    if (!this.isMasterAuthenticated) return;
    
    try {
      // ゲーム状態の取得
      const gameState = await this.getGameState();
      
      if (gameState) {
        // フォームにゲーム状態を反映
        this.elements.gameStatusSelect.value = gameState.status || 'preparing';
        this.elements.timeRemaining.value = gameState.timeRemaining || 1800;
      }
      
      // アクティブな問題の取得
      const activePuzzle = await this.getActivePuzzle();
      
      if (activePuzzle) {
        this.activePuzzleId = activePuzzle.id;
        
        // フォームに問題データを反映
        this.elements.puzzleTitle.value = activePuzzle.title || '';
        this.elements.puzzleDescription.value = activePuzzle.description || '';
        this.elements.puzzleImageUrl.value = activePuzzle.imageUrl || '';
        this.elements.puzzleAnswer.value = activePuzzle.answer || '';
        
        // ヒント一覧の取得と表示
        this.loadHints(activePuzzle.id);
      }
    } catch (error) {
      console.error('アクティブゲーム情報の取得エラー:', error);
      this.showNotification('ゲーム情報の取得に失敗しました', 'error');
    }
  },
  
  // マスター画面の表示
  showMasterDashboard() {
    // プレイヤー画面を非表示
    this.elements.playerNameContainer.style.display = 'none';
    this.elements.dashboard.style.display = 'none';
    
    // マスター画面を表示
    this.elements.masterDashboard.style.display = 'block';
    
    // マスター認証状態に応じて表示を切り替え
    this.checkMasterAuthState();
  },
  
  // マスターログイン処理
  handleMasterLogin() {
    const password = this.elements.masterPassword.value;
    
    if (password === this.MASTER_PASSWORD) {
      this.isMasterAuthenticated = true;
      localStorage.setItem('master_auth', 'true');
      this.elements.masterAccessForm.style.display = 'none';
      this.elements.masterControls.style.display = 'block';
      this.showNotification('マスター認証成功', 'success');
      this.checkActiveGame();
    } else {
      this.showNotification('パスワードが違います', 'error');
    }
  },
  
  // ゲーム状態の更新
  async updateGameStatus() {
    if (!this.isMasterAuthenticated) {
      this.showNotification('マスター認証が必要です', 'error');
      return;
    }
    
    const status = this.elements.gameStatusSelect.value;
    const timeRemaining = parseInt(this.elements.timeRemaining.value, 10) || 0;
    
    let statusText = '準備中';
    switch (status) {
      case 'active':
        statusText = '進行中';
        break;
      case 'paused':
        statusText = '一時停止';
        break;
      case 'finished':
        statusText = '終了';
        break;
    }
    
    try {
      // 「進行中」に変更した場合、現在のアクティブな問題の画像URLをpuzzle1.pngに設定
      if (status === 'active' && this.activePuzzleId) {
        await firebaseUtils.db.collection('puzzles')
          .doc(this.activePuzzleId)
          .update({ imageUrl: 'puzzle1.png' });
      }
      
      const result = await firebaseUtils.updateGameState({
        status: status,
        statusText: statusText,
        timeRemaining: timeRemaining,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      if (result.success) {
        this.showNotification('ゲーム状態を更新しました', 'success');
      } else {
        this.showNotification('ゲーム状態の更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('ゲーム状態更新エラー:', error);
      this.showNotification('ゲーム状態の更新に失敗しました', 'error');
    }
  },
  
  // 問題の作成/更新
  async createOrUpdatePuzzle() {
    if (!this.isMasterAuthenticated) {
      this.showNotification('マスター認証が必要です', 'error');
      return;
    }
    
    const title = this.elements.puzzleTitle.value.trim();
    const description = this.elements.puzzleDescription.value.trim();
    const imageUrl = this.elements.gameStatusSelect.value === 'active' ? 'puzzle1.png' : this.elements.puzzleImageUrl.value.trim();
    const answer = this.elements.puzzleAnswer.value.trim();
    
    if (!title || !description || !answer) {
      this.showNotification('タイトル、問題内容、正解は必須です', 'error');
      return;
    }
    
    try {
      // 既存のアクティブな問題を非アクティブにする
      if (this.activePuzzleId) {
        await firebaseUtils.db.collection('puzzles')
          .doc(this.activePuzzleId)
          .update({ status: 'inactive' });
      }
      
      // 新しい問題を作成
      const puzzleRef = firebaseUtils.db.collection('puzzles').doc();
      await puzzleRef.set({
        title: title,
        description: description,
        imageUrl: imageUrl,
        answer: answer,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.activePuzzleId = puzzleRef.id;
      this.showNotification('問題を作成/更新しました', 'success');
      
      // ヒント一覧を初期化
      this.elements.hintsList.innerHTML = '<p>ヒントはまだありません</p>';
    } catch (error) {
      console.error('問題作成エラー:', error);
      this.showNotification('問題の作成に失敗しました', 'error');
    }
  },
  
  // ヒントの追加
  async addHint() {
    if (!this.isMasterAuthenticated) {
      this.showNotification('マスター認証が必要です', 'error');
      return;
    }
    
    if (!this.activePuzzleId) {
      this.showNotification('先に問題を作成してください', 'error');
      return;
    }
    
    const title = this.elements.hintTitle.value.trim();
    const content = this.elements.hintContent.value.trim();
    const cost = parseInt(this.elements.hintCost.value, 10) || 10;
    
    if (!title || !content) {
      this.showNotification('タイトルと内容は必須です', 'error');
      return;
    }
    
    try {
      const hintRef = firebaseUtils.db.collection('puzzles')
        .doc(this.activePuzzleId)
        .collection('hints')
        .doc();
      
      await hintRef.set({
        title: title,
        content: content,
        cost: cost,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // フォームをクリア
      this.elements.hintTitle.value = '';
      this.elements.hintContent.value = '';
      this.elements.hintCost.value = '10';
      
      // ヒント一覧を更新
      this.loadHints(this.activePuzzleId);
      
      this.showNotification('ヒントを追加しました', 'success');
    } catch (error) {
      console.error('ヒント追加エラー:', error);
      this.showNotification('ヒントの追加に失敗しました', 'error');
    }
  },
  
  // ヒント一覧の取得と表示
  async loadHints(puzzleId) {
    if (!puzzleId) return;
    
    try {
      const hints = await firebaseUtils.getPuzzleHints(puzzleId);
      
      if (hints.length === 0) {
        this.elements.hintsList.innerHTML = '<p>ヒントはまだありません</p>';
        return;
      }
      
      const html = hints.map(hint => `
        <div class="hint-item" data-hint-id="${hint.id}">
          <div class="hint-item-info">
            <div class="hint-item-title">${hint.title}</div>
            <div class="hint-item-content">${hint.content}</div>
            <div class="hint-item-cost">${hint.cost}ポイント</div>
          </div>
          <div class="hint-item-actions">
            <button class="hint-edit-btn" data-hint-id="${hint.id}">編集</button>
            <button class="hint-delete-btn" data-hint-id="${hint.id}">削除</button>
          </div>
        </div>
      `).join('');
      
      this.elements.hintsList.innerHTML = html;
      
      // ヒント編集/削除ボタンのイベント設定
      const editButtons = document.querySelectorAll('.hint-edit-btn');
      const deleteButtons = document.querySelectorAll('.hint-delete-btn');
      
      editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const hintId = e.target.dataset.hintId;
          this.editHint(puzzleId, hintId);
        });
      });
      
      deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const hintId = e.target.dataset.hintId;
          this.deleteHint(puzzleId, hintId);
        });
      });
    } catch (error) {
      console.error('ヒント一覧取得エラー:', error);
      this.elements.hintsList.innerHTML = '<p>ヒントの読み込みに失敗しました</p>';
    }
  },
  
  // ヒントの編集
  async editHint(puzzleId, hintId) {
    if (!puzzleId || !hintId) return;
    
    try {
      // ヒント情報の取得
      const hintDoc = await firebaseUtils.db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .doc(hintId)
        .get();
      
      if (!hintDoc.exists) {
        this.showNotification('ヒントが存在しません', 'error');
        return;
      }
      
      const hintData = hintDoc.data();
      
      // フォームにヒント情報を設定
      this.elements.hintTitle.value = hintData.title || '';
      this.elements.hintContent.value = hintData.content || '';
      this.elements.hintCost.value = hintData.cost || 10;
      
      // 編集モードであることを示すデータ属性を設定
      this.elements.addHintButton.dataset.editMode = 'true';
      this.elements.addHintButton.dataset.hintId = hintId;
      this.elements.addHintButton.textContent = 'ヒントを更新';
      
      // 編集中のヒントIDを保存
      this.editingHintId = hintId;
      
      // ヒント更新用のイベントリスナーを変更
      this.elements.addHintButton.removeEventListener('click', this.addHint);
      this.elements.addHintButton.addEventListener('click', () => {
        this.updateHint(puzzleId, hintId);
      });
    } catch (error) {
      console.error('ヒント編集エラー:', error);
      this.showNotification('ヒットの編集準備に失敗しました', 'error');
    }
  },
  
  // ヒントの更新
  async updateHint(puzzleId, hintId) {
    if (!puzzleId || !hintId) return;
    
    const title = this.elements.hintTitle.value.trim();
    const content = this.elements.hintContent.value.trim();
    const cost = parseInt(this.elements.hintCost.value, 10) || 10;
    
    if (!title || !content) {
      this.showNotification('タイトルと内容は必須です', 'error');
      return;
    }
    
    try {
      await firebaseUtils.db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .doc(hintId)
        .update({
          title: title,
          content: content,
          cost: cost,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      
      // フォームをクリア
      this.elements.hintTitle.value = '';
      this.elements.hintContent.value = '';
      this.elements.hintCost.value = '10';
      
      // ボタンを元に戻す
      this.elements.addHintButton.dataset.editMode = 'false';
      this.elements.addHintButton.textContent = 'ヒントを追加';
      
      // イベントリスナーを戻す
      this.elements.addHintButton.removeEventListener('click', this.updateHint);
      this.elements.addHintButton.addEventListener('click', this.addHint);
      
      // ヒント一覧を更新
      this.loadHints(puzzleId);
      
      this.showNotification('ヒントを更新しました', 'success');
    } catch (error) {
      console.error('ヒント更新エラー:', error);
      this.showNotification('ヒントの更新に失敗しました', 'error');
    }
  },
  
  // ヒントの削除
  async deleteHint(puzzleId, hintId) {
    if (!puzzleId || !hintId) return;
    
    if (!confirm('このヒントを削除しますか？')) return;
    
    try {
      await firebaseUtils.db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .doc(hintId)
        .delete();
      
      // ヒント一覧を更新
      this.loadHints(puzzleId);
      
      this.showNotification('ヒントを削除しました', 'success');
    } catch (error) {
      console.error('ヒント削除エラー:', error);
      this.showNotification('ヒントの削除に失敗しました', 'error');
    }
  },
  
  // 結果の計算
  async calculateResults() {
    if (!this.isMasterAuthenticated) {
      this.showNotification('マスター認証が必要です', 'error');
      return;
    }
    
    try {
      // プレイヤー一覧の取得
      const playersSnapshot = await firebaseUtils.db.collection('participants')
        .orderBy('totalPoints', 'desc')
        .get();
      
      const players = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 賭けの集計
      const betsSnapshot = await firebaseUtils.db.collection('bets')
        .where('status', '==', 'active')
        .get();
      
      const betsByTarget = {};
      betsSnapshot.docs.forEach(doc => {
        const bet = doc.data();
        if (!betsByTarget[bet.target]) {
          betsByTarget[bet.target] = [];
        }
        betsByTarget[bet.target].push({
          id: doc.id,
          ...bet
        });
      });
      
      // 結果の表示
      let resultsHtml = '<h4>プレイヤーランキング</h4>';
      
      if (players.length === 0) {
        resultsHtml += '<p>プレイヤーはまだいません</p>';
      } else {
        resultsHtml += '<div class="players-ranking">';
        players.forEach((player, index) => {
          resultsHtml += `
            <div class="result-item">
              <div class="result-player">${index + 1}. ${player.name}</div>
              <div class="result-detail">${player.totalPoints || 0}ポイント</div>
            </div>
          `;
        });
        resultsHtml += '</div>';
      }
      
      resultsHtml += '<h4>賭けの集計</h4>';
      
      if (Object.keys(betsByTarget).length === 0) {
        resultsHtml += '<p>有効な賭けはまだありません</p>';
      } else {
        resultsHtml += '<div class="bets-summary">';
        for (const target in betsByTarget) {
          const bets = betsByTarget[target];
          const totalPoints = bets.reduce((sum, bet) => sum + bet.points, 0);
          
          resultsHtml += `
            <div class="result-item">
              <div class="result-player">${target}</div>
              <div class="result-detail">${bets.length}件の賭け / 合計${totalPoints}ポイント</div>
            </div>
          `;
        }
        resultsHtml += '</div>';
      }
      
      this.elements.resultsDisplay.innerHTML = resultsHtml;
    } catch (error) {
      console.error('結果計算エラー:', error);
      this.showNotification('結果の計算に失敗しました', 'error');
    }
  },
  
  // ゲーム状態の取得
  async getGameState() {
    try {
      const doc = await firebaseUtils.db.collection('gameState').doc('current').get();
      
      if (doc.exists) {
        return doc.data();
      }
      
      return null;
    } catch (error) {
      console.error('ゲーム状態取得エラー:', error);
      return null;
    }
  },
  
  // アクティブな問題の取得
  async getActivePuzzle() {
    try {
      return await firebaseUtils.getActivePuzzle();
    } catch (error) {
      console.error('アクティブ問題取得エラー:', error);
      return null;
    }
  },
  
  // 通知の表示
  showNotification(message, type = 'info') {
    app.showNotification(message, type);
  }
};

// DOMが読み込まれたらマスターコンポーネントを初期化
document.addEventListener('DOMContentLoaded', () => {
  masterComponent.init();
}); 