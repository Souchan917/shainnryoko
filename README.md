# 賭け謎解きイベントアプリ

社員旅行で使用する30分程度の謎解きイベント用のWebアプリケーションです。事前アクティビティで得たポイントや賭け投票結果を統合して最終得点を決定するシステムを提供します。

## 機能

- **ユーザー認証・プロフィール管理**
  - メールアドレスによるログイン／登録
  - プレイヤーごとのポイントや投票状況の管理

- **ポイント管理システム**
  - 事前アクティビティの得点、謎解き本番の得点、賭け投票の収支を加算・減算
  - ポイント履歴の記録と表示

- **賭け投票システム**
  - 予想対象（例：謎解き本番で1位になる人物）に対して賭ける機能
  - 賭けたポイントに基づく還元（例：還元率1.5～2倍など）

- **謎解きゲーム画面**
  - 問題文、タイマー、解答入力、ヒント購入（ポイント消費）機能
  - リアルタイムでの問題更新

- **ランキング・結果表示**
  - リアルタイムで各参加者の得点や順位を更新・表示

## 技術スタック

- **フロントエンド**
  - HTML5, CSS3, JavaScript (ES6+)
  - レスポンシブデザイン対応

- **バックエンド**
  - Firebase Authentication - ユーザー認証
  - Firebase Firestore - データベース
  - Firebase Hosting - ホスティング（オプション）

## セットアップ方法

### 1. Firebaseの設定

1. [Firebase Console](https://console.firebase.google.com/)にアクセスし、新しいプロジェクトを作成
2. Authentication 機能を有効化し、メール/パスワード認証を有効にする
3. Firestore データベースを作成
4. プロジェクト設定からWebアプリを追加し、設定情報をコピー

### 2. アプリケーションの設定

1. `app/utils/firebase.js` ファイルを開き、Firebaseの設定情報を更新:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. デプロイ

#### ローカルテスト

```
npx http-server
```

または任意のHTTPサーバーでホスティングしてください。

#### Firebase Hostingでデプロイ（オプション）

1. Firebase CLIをインストール
```
npm install -g firebase-tools
```

2. ログインとプロジェクト初期化
```
firebase login
firebase init
```

3. デプロイ
```
firebase deploy
```

## Firestore データ構造

主なコレクション:

- **participants**: ユーザー情報
- **puzzles**: 謎解き問題
- **bets**: 賭け情報
- **answers**: 解答記録
- **pointHistory**: ポイント履歴
- **hintPurchases**: ヒント購入履歴

## 管理機能

管理者は以下のことができます：

1. 参加者の得点調整
2. 謎解き問題の追加・編集・有効化
3. 賭けの結果確定と配当処理
4. イベント全体の進行管理

## ライセンス

このプロジェクトは内部イベント用に作成されたものであり、自由に改変・使用できます。 