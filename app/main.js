// メインアプリケーション
const app = {
  // 初期化
  init() {
    // Firebaseが読み込まれているか確認
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDKが読み込まれていません。');
      this.showFirebaseError();
      return;
    }
    
    // 開発モードの場合、コンソールに詳細を表示
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
      console.log('開発モードで実行中');
    }
    
    // Firebaseの設定が正しいか確認
    try {
      if (firebaseConfig.apiKey === 'YOUR_API_KEY' || 
          firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
        console.warn('Firebaseの設定がデフォルト値のままです。firebase.jsファイルを更新してください。');
        
        if (!isDevelopment) {
          // 本番環境では警告を表示
          this.showFirebaseError('Firebase設定が完了していません');
        }
      }
    } catch (error) {
      console.error('Firebase設定の確認に失敗しました', error);
    }
    
    // サービスワーカーの登録（PWA対応）
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
          console.log('ServiceWorkerが登録されました', registration.scope);
        }).catch(error => {
          console.log('ServiceWorkerの登録に失敗しました:', error);
        });
      });
    }
    
    // 初期表示
    this.checkBrowserCompatibility();
    
    // ローカルストレージのサポート確認
    if (!this.isLocalStorageSupported()) {
      console.warn('localStorage がサポートされていません。プレイヤー情報が保存されない可能性があります。');
      this.showNotification('このブラウザではプレイヤー情報が正しく保存されない可能性があります', 'warning');
    }
  },
  
  // ブラウザの互換性チェック
  checkBrowserCompatibility() {
    const isModernBrowser = 'fetch' in window && 'Promise' in window;
    
    if (!isModernBrowser) {
      const container = document.querySelector('.container');
      if (container) {
        container.innerHTML = `
          <div class="compatibility-warning">
            <h2>ブラウザの更新が必要です</h2>
            <p>お使いのブラウザでは、このアプリケーションが正しく動作しない可能性があります。</p>
            <p>Google Chrome、Firefox、Microsoft Edge、Safariなどの最新ブラウザをご利用ください。</p>
          </div>
        `;
      }
    }
  },
  
  // Firebase設定エラーの表示
  showFirebaseError(message = 'Firebase SDKの読み込みに失敗しました') {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="firebase-error">
          <h2>接続エラー</h2>
          <p>${message}</p>
          <p>アプリを利用するには、管理者に問い合わせてください。</p>
        </div>
      `;
    }
  },
  
  // ローカルストレージのサポート確認
  isLocalStorageSupported() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      const result = localStorage.getItem(testKey) === testKey;
      localStorage.removeItem(testKey);
      return result;
    } catch (e) {
      return false;
    }
  },
  
  // 通知の表示
  showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.className = `notification ${type}`;
    notificationContainer.textContent = message;
    
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 通知を表示
    document.body.appendChild(notificationContainer);
    
    // 一定時間後に通知を削除
    setTimeout(() => {
      notificationContainer.remove();
    }, 5000);
  }
};

// DOMが読み込まれたらアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
  app.init();
}); 