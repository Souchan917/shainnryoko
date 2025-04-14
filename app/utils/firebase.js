// Firebase設定ファイル
const firebaseConfig = {
  apiKey: "AIzaSyCpAdi55yaEr78W3Hc-_j9FN_snS7z5mRI",
  authDomain: "syainn-8ae20.firebaseapp.com",
  projectId: "syainn-8ae20",
  storageBucket: "syainn-8ae20.firebasestorage.app",
  messagingSenderId: "797239462271",
  appId: "1:797239462271:web:279ffed9c84ca01772724a",
  measurementId: "G-PKJ4GG8ZQQ"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// データベースのリファレンス
const db = firebase.firestore();

// タイムスタンプの設定
db.settings({
  timestampsInSnapshots: true
});

// Firebaseの機能をエクスポート
const firebaseUtils = {
  db,
  
  // ユーザープロフィールの作成・更新
  updateUserProfile: async (uid, userData) => {
    try {
      await db.collection('participants').doc(uid).set({
        ...userData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('プロフィール更新に失敗しました', error);
      return false;
    }
  },
  
  // ポイントの更新
  updatePoints: async (uid, points, reason) => {
    try {
      // トランザクションでポイント更新を実行（競合を防ぐ）
      return db.runTransaction(async (transaction) => {
        const docRef = db.collection('participants').doc(uid);
        const doc = await transaction.get(docRef);
        
        if (!doc.exists) {
          throw new Error('ユーザーが存在しません');
        }
        
        const currentPoints = doc.data().totalPoints || 0;
        const newPoints = currentPoints + points;
        
        transaction.update(docRef, { 
          totalPoints: newPoints,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // ポイント履歴を追加
        const historyRef = db.collection('pointHistory').doc();
        transaction.set(historyRef, {
          userId: uid,
          points: points,
          reason: reason,
          previousTotal: currentPoints,
          newTotal: newPoints,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return newPoints;
      });
    } catch (error) {
      console.error('ポイント更新に失敗しました', error);
      throw error;
    }
  },
  
  // 賭けを登録
  placeBet: async (uid, betData) => {
    try {
      // ユーザーの現在のポイントを確認
      const userDoc = await db.collection('participants').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('ユーザーが存在しません');
      }
      
      const userData = userDoc.data();
      const currentPoints = userData.totalPoints || 0;
      
      if (currentPoints < betData.points) {
        throw new Error('ポイントが不足しています');
      }
      
      // トランザクションで賭けを登録し、ポイントを減算
      return db.runTransaction(async (transaction) => {
        // 新しい賭けを作成
        const betRef = db.collection('bets').doc();
        transaction.set(betRef, {
          ...betData,
          userId: uid,
          status: 'active', // active, completed, cancelled
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // ユーザーのポイントを減算
        const userRef = db.collection('participants').doc(uid);
        transaction.update(userRef, {
          totalPoints: currentPoints - betData.points,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // ポイント履歴に追加
        const historyRef = db.collection('pointHistory').doc();
        transaction.set(historyRef, {
          userId: uid,
          points: -betData.points,
          reason: `「${betData.target}」への賭け`,
          previousTotal: currentPoints,
          newTotal: currentPoints - betData.points,
          betId: betRef.id,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          betId: betRef.id,
          newTotal: currentPoints - betData.points
        };
      });
    } catch (error) {
      console.error('賭けの登録に失敗しました', error);
      throw error;
    }
  },
  
  // ユーザーの賭け一覧を取得
  getUserBets: async (uid) => {
    try {
      const snapshot = await db.collection('bets')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('賭け一覧の取得に失敗しました', error);
      return [];
    }
  },
  
  // 全参加者のランキングを取得
  getRankings: async () => {
    try {
      const snapshot = await db.collection('participants')
        .orderBy('totalPoints', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data()
      }));
    } catch (error) {
      console.error('ランキングの取得に失敗しました', error);
      return [];
    }
  },
  
  // 現在アクティブな謎解き問題を取得
  getActivePuzzle: async () => {
    try {
      const snapshot = await db.collection('puzzles')
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const puzzleDoc = snapshot.docs[0];
      return {
        id: puzzleDoc.id,
        ...puzzleDoc.data()
      };
    } catch (error) {
      console.error('アクティブな問題の取得に失敗しました', error);
      return null;
    }
  },
  
  // ヒント一覧を取得
  getPuzzleHints: async (puzzleId) => {
    try {
      const snapshot = await db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .orderBy('cost', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('ヒントの取得に失敗しました', error);
      return [];
    }
  },
  
  // ヒントを購入
  purchaseHint: async (uid, puzzleId, hintId) => {
    try {
      // ヒント情報を取得
      const hintDoc = await db.collection('puzzles')
        .doc(puzzleId)
        .collection('hints')
        .doc(hintId)
        .get();
      
      if (!hintDoc.exists) {
        throw new Error('ヒントが存在しません');
      }
      
      const hintData = hintDoc.data();
      const hintCost = hintData.cost || 0;
      
      // ユーザー情報を取得
      const userDoc = await db.collection('participants').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('ユーザーが存在しません');
      }
      
      const userData = userDoc.data();
      const currentPoints = userData.totalPoints || 0;
      
      if (currentPoints < hintCost) {
        throw new Error('ポイントが不足しています');
      }
      
      // トランザクションでヒント購入処理
      return db.runTransaction(async (transaction) => {
        // ユーザーのポイントを減算
        const userRef = db.collection('participants').doc(uid);
        transaction.update(userRef, {
          totalPoints: currentPoints - hintCost,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 購入履歴を記録
        const purchaseRef = db.collection('hintPurchases').doc();
        transaction.set(purchaseRef, {
          userId: uid,
          puzzleId: puzzleId,
          hintId: hintId,
          cost: hintCost,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // ポイント履歴を記録
        const historyRef = db.collection('pointHistory').doc();
        transaction.set(historyRef, {
          userId: uid,
          points: -hintCost,
          reason: `「${hintData.title}」ヒントの購入`,
          previousTotal: currentPoints,
          newTotal: currentPoints - hintCost,
          puzzleId: puzzleId,
          hintId: hintId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          hint: hintData,
          newTotal: currentPoints - hintCost
        };
      });
    } catch (error) {
      console.error('ヒント購入に失敗しました', error);
      throw error;
    }
  },
  
  // --------- リアルタイム同期機能 ---------
  
  // プレイヤーのリアルタイム監視を設定
  subscribeToPlayer: (playerId, callback) => {
    return db.collection('participants').doc(playerId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            data.id = doc.id;
            callback({ success: true, data });
          } else {
            callback({ success: false, error: 'プレイヤーが存在しません' });
          }
        },
        (error) => {
          console.error('プレイヤー情報の監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // ランキングのリアルタイム監視を設定
  subscribeToRankings: (callback, limit = 20) => {
    return db.collection('participants')
      .orderBy('totalPoints', 'desc')
      .limit(limit)
      .onSnapshot(
        (snapshot) => {
          const rankings = snapshot.docs.map((doc, index) => ({
            id: doc.id,
            rank: index + 1,
            ...doc.data()
          }));
          callback({ success: true, data: rankings });
        },
        (error) => {
          console.error('ランキングの監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // 賭け情報のリアルタイム監視を設定
  subscribeToBets: (callback) => {
    return db.collection('bets')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const bets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback({ success: true, data: bets });
        },
        (error) => {
          console.error('賭け情報の監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // ユーザーの賭け情報のリアルタイム監視を設定
  subscribeToUserBets: (userId, callback) => {
    return db.collection('bets')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const bets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback({ success: true, data: bets });
        },
        (error) => {
          console.error('ユーザー賭け情報の監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // ゲーム状態のリアルタイム監視を設定
  subscribeToGameState: (callback) => {
    return db.collection('gameState')
      .doc('current')
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback({ success: true, data: doc.data() });
          } else {
            callback({ success: false, error: 'ゲーム状態が存在しません' });
          }
        },
        (error) => {
          console.error('ゲーム状態の監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // アクティブな謎解きのリアルタイム監視を設定
  subscribeToActivePuzzle: (callback) => {
    return db.collection('puzzles')
      .where('status', '==', 'active')
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            callback({ 
              success: true, 
              data: {
                id: doc.id,
                ...doc.data()
              }
            });
          } else {
            callback({ success: true, data: null });
          }
        },
        (error) => {
          console.error('アクティブな問題の監視でエラーが発生しました', error);
          callback({ success: false, error: error.message });
        }
      );
  },
  
  // ゲーム状態を更新
  updateGameState: async (stateData) => {
    try {
      await db.collection('gameState').doc('current').set({
        ...stateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('ゲーム状態の更新に失敗しました', error);
      return { success: false, error: error.message };
    }
  }
};

// グローバルスコープで利用可能にする
window.firebaseUtils = firebaseUtils; 