import { useState, useEffect } from 'react';
import playerManager from './playerManager';
import styles from '../styles/PlayerLogin.module.css';

function PlayerLogin({ onLogin }) {
  const [playerName, setPlayerName] = useState('');
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 既存プレイヤーリスト取得
  useEffect(() => {
    setIsLoading(true);
    playerManager.getAllPlayers()
      .then(players => {
        setExistingPlayers(players);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('プレイヤーリストの取得エラー:', err);
        setError('プレイヤーリストを読み込めませんでした');
        setIsLoading(false);
      });
  }, []);
  
  // 新規プレイヤー登録処理
  const handleRegister = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('名前を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    playerManager.registerPlayer(playerName)
      .then(player => {
        setIsLoading(false);
        if (onLogin) onLogin(player);
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || 'プレイヤー登録に失敗しました');
      });
  };
  
  // 既存プレイヤー選択処理
  const handleSelectPlayer = (playerId) => {
    setIsLoading(true);
    setError(null);
    
    playerManager.selectPlayer(playerId)
      .then(player => {
        setIsLoading(false);
        if (onLogin) onLogin(player);
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || 'プレイヤー選択に失敗しました');
      });
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>プレイヤー名を入力</h2>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleRegister} className={styles.form}>
        <div className={styles.formGroup}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="あなたの名前を入力"
            disabled={isLoading}
            className={styles.input}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading} 
          className={styles.button}
        >
          {isLoading ? '処理中...' : '登録してプレイ'}
        </button>
      </form>
      
      {existingPlayers.length > 0 && (
        <div className={styles.existingPlayers}>
          <h3 className={styles.subtitle}>または既存のプレイヤーを選択</h3>
          <div className={styles.playersList}>
            {existingPlayers.map(player => (
              <div 
                key={player.id} 
                className={styles.playerItem}
                onClick={() => handleSelectPlayer(player.id)}
              >
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.playerPoints}>{player.points}ポイント</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerLogin; 