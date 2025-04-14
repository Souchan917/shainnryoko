// 認証関連の機能
const authUtils = {
  // 現在のユーザー状態を監視
  onAuthStateChanged: (callback) => {
    return firebaseUtils.auth.onAuthStateChanged(async (user) => {
      if (user) {
        // ユーザーがログインしている場合
        try {
          // Firestoreからユーザー情報を取得
          const userProfile = await firebaseUtils.getUserProfile(user.uid);
          
          // プロフィールがなければ初期化
          if (!userProfile) {
            const newUserData = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'ゲスト',
              totalPoints: 0,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await firebaseUtils.updateUserProfile(user.uid, newUserData);
          }
          
          callback({
            isAuthenticated: true,
            user: user,
            profile: userProfile || {
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'ゲスト',
              totalPoints: 0
            }
          });
        } catch (error) {
          console.error('ユーザー情報の取得に失敗しました', error);
          callback({ isAuthenticated: true, user: user, profile: null });
        }
      } else {
        // ユーザーがログアウトしている場合
        callback({ isAuthenticated: false, user: null, profile: null });
      }
    });
  },
  
  // メールとパスワードでログイン
  loginWithEmail: async (email, password) => {
    try {
      const userCredential = await firebaseUtils.auth.signInWithEmailAndPassword(email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('ログインに失敗しました', error);
      let errorMessage = 'ログインに失敗しました';
      
      // エラーコードに応じたメッセージ
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'メールアドレスの形式が正しくありません';
          break;
        case 'auth/user-disabled':
          errorMessage = 'このアカウントは無効化されています';
          break;
        case 'auth/user-not-found':
          errorMessage = 'ユーザーが見つかりません';
          break;
        case 'auth/wrong-password':
          errorMessage = 'パスワードが間違っています';
          break;
        default:
          errorMessage = `エラー: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  // 新規アカウント登録
  registerWithEmail: async (email, password, name) => {
    try {
      // アカウント作成
      const userCredential = await firebaseUtils.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // 表示名を設定
      await user.updateProfile({
        displayName: name
      });
      
      // Firestoreにユーザー情報を保存
      await firebaseUtils.updateUserProfile(user.uid, {
        uid: user.uid,
        email: email,
        name: name,
        totalPoints: 100, // 初期ポイント
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // ポイント履歴を記録
      await db.collection('pointHistory').add({
        userId: user.uid,
        points: 100,
        reason: '新規登録ボーナス',
        previousTotal: 0,
        newTotal: 100,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('アカウント登録に失敗しました', error);
      let errorMessage = 'アカウント登録に失敗しました';
      
      // エラーコードに応じたメッセージ
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'このメールアドレスは既に使用されています';
          break;
        case 'auth/invalid-email':
          errorMessage = 'メールアドレスの形式が正しくありません';
          break;
        case 'auth/weak-password':
          errorMessage = 'パスワードが弱すぎます。6文字以上にしてください';
          break;
        default:
          errorMessage = `エラー: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  // ログアウト
  logout: async () => {
    try {
      await firebaseUtils.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('ログアウトに失敗しました', error);
      return {
        success: false,
        error: 'ログアウトに失敗しました'
      };
    }
  }
};

// グローバルスコープでauthUtilsを利用可能にする
window.authUtils = authUtils; 