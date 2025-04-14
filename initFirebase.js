// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCpAdi55yaEr78W3Hc-_j9FN_snS7z5mRI",
  authDomain: "syainn-8ae20.firebaseapp.com",
  projectId: "syainn-8ae20",
  storageBucket: "syainn-8ae20.appspot.com", 
  messagingSenderId: "797239462271",
  appId: "1:797239462271:web:279ffed9c84ca01772724a",
  measurementId: "G-PKJ4GG8ZQQ"
};

// Firebaseアプリの初期化
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    console.log("Firebase initialized successfully");
    
    return {
      db: firebase.firestore(),
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return {
      db: null,
      success: false,
      error: error
    };
  }
}

// DOMが読み込まれたらFirebaseを初期化
document.addEventListener('DOMContentLoaded', function() {
  const firebaseInstance = initFirebase();
  
  if (firebaseInstance.success) {
    console.log("Firestore接続を開始しました");
    
    // 接続テスト - テストデータ書き込み
    firebaseInstance.db.collection('connectionTest').doc('status').set({
      timestamp: Date.now(),
      status: 'connected'
    })
    .then(() => {
      console.log('接続テストデータ書き込み成功');
    })
    .catch(err => {
      console.error('接続テストデータ書き込み失敗:', err);
    });
  } else {
    console.error("Firebase接続に失敗しました。ローカルモードで動作します。");
    alert("Firebase接続エラー: " + firebaseInstance.error.message);
  }
}); 