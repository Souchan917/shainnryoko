document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const gameArea = document.getElementById('game-area');
    const scoresList = document.getElementById('scores');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const rankingFilter = document.getElementById('ranking-filter');
    
    // ゲームの状態管理
    let gameActive = false;
    let scores = [];
    let currentPlayer = '';
    let gameTimer = null;
    let timeLeft = 30; // デフォルトのゲーム時間（秒）
    
    // ローカルストレージからスコアを読み込む
    loadScores();
    
    // タブ切り替え
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // アクティブなタブを更新
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // タブパネルを切り替え
            const targetTab = btn.dataset.tab;
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${targetTab}-section`) {
                    pane.classList.add('active');
                }
            });
            
            // ランキングタブが選択された場合はランキングを更新
            if (targetTab === 'ranking') {
                updateRanking(rankingFilter.value);
            }
        });
    });
    
    // ランキングフィルター
    rankingFilter.addEventListener('change', () => {
        updateRanking(rankingFilter.value);
    });
    
    // ゲーム開始イベント
    startBtn.addEventListener('click', () => {
        if (!gameActive) {
            startGame();
        }
    });
    
    // リセットイベント
    resetBtn.addEventListener('click', () => {
        if (confirm('本当にすべてのスコアをリセットしますか？')) {
            resetGame();
        }
    });
    
    // ゲーム開始関数
    function startGame() {
        gameActive = true;
        currentPlayer = prompt('あなたの名前を入力してください:');
        if (!currentPlayer) {
            currentPlayer = '名無しさん';
        }
        
        // チーム名の入力（オプション）
        let team = prompt('チーム名を入力してください（省略可）:');
        if (!team) {
            team = '無所属';
        }
        
        timeLeft = 30; // ゲーム時間をリセット
        
        gameArea.innerHTML = `
            <div class="game-stats">
                残り時間: <span class="timer">${timeLeft}</span>秒
            </div>
            <h3>${currentPlayer}さん、ゲーム開始！</h3>
            <div class="game-play">
                <div id="click-target" class="click-target">タップ!</div>
                <p>得点: <span id="current-score">0</span></p>
            </div>
        `;
        
        // クリックターゲットの設定
        const clickTarget = document.getElementById('click-target');
        const currentScoreDisplay = document.getElementById('current-score');
        
        let playerScore = 0;
        
        // タイマーの開始
        const timerDisplay = document.querySelector('.timer');
        gameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                endGame(playerScore, team);
            }
        }, 1000);
        
        // タップ/クリックイベント
        clickTarget.addEventListener('click', () => {
            playerScore += 1;
            currentScoreDisplay.textContent = playerScore;
            
            // ターゲットサイズを少し小さくする
            clickTarget.style.transform = 'scale(0.9)';
            setTimeout(() => {
                clickTarget.style.transform = '';
            }, 100);
            
            // ターゲットの位置をランダムに変更
            const gamePlay = document.querySelector('.game-play');
            const maxX = gamePlay.clientWidth - clickTarget.clientWidth;
            const maxY = gamePlay.clientHeight - clickTarget.clientHeight;
            
            clickTarget.style.left = Math.floor(Math.random() * maxX) + 'px';
            clickTarget.style.top = Math.floor(Math.random() * maxY) + 'px';
        });
    }
    
    // ゲーム終了関数
    function endGame(finalScore, team) {
        gameActive = false;
        clearInterval(gameTimer);
        
        // 日付を取得
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
        
        // スコアの保存
        scores.push({
            player: currentPlayer,
            score: finalScore,
            date: dateStr,
            team: team
        });
        
        // スコアを降順でソート
        scores.sort((a, b) => b.score - a.score);
        
        // ローカルストレージに保存
        saveScores();
        
        // 結果表示
        updateRanking(rankingFilter.value);
        
        gameArea.innerHTML = `
            <h3>ゲーム終了！</h3>
            <p>${currentPlayer}さんの得点: <span class="final-score">${finalScore}</span>点</p>
            <p>もう一度プレイするには「ゲーム開始」ボタンを押してください</p>
            <button id="view-ranking" class="btn primary-btn">ランキングを見る</button>
        `;
        
        // ランキングを見るボタン
        document.getElementById('view-ranking').addEventListener('click', () => {
            // ランキングタブを自動的に選択
            document.querySelector('.tab-btn[data-tab="ranking"]').click();
        });
    }
    
    // リセット関数
    function resetGame() {
        gameActive = false;
        if (gameTimer) {
            clearInterval(gameTimer);
        }
        scores = [];
        saveScores();
        updateRanking(rankingFilter.value);
        
        gameArea.innerHTML = `
            <p>ゲームを開始するには「ゲーム開始」ボタンを押してください</p>
        `;
    }
    
    // ランキング更新関数
    function updateRanking(filter) {
        scoresList.innerHTML = '';
        
        let filteredScores = [...scores];
        
        // フィルターの適用
        if (filter === 'today') {
            const today = new Date();
            const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
            filteredScores = scores.filter(score => score.date === dateStr);
        } else if (filter === 'team') {
            // チームごとに最高スコアだけを表示
            const teamMap = new Map();
            scores.forEach(score => {
                if (!teamMap.has(score.team) || teamMap.get(score.team).score < score.score) {
                    teamMap.set(score.team, score);
                }
            });
            filteredScores = Array.from(teamMap.values());
            filteredScores.sort((a, b) => b.score - a.score);
        }
        
        if (filteredScores.length === 0) {
            scoresList.innerHTML = '<li class="no-scores">まだ記録がありません</li>';
            return;
        }
        
        filteredScores.forEach((scoreData, index) => {
            const scoreItem = document.createElement('li');
            
            // ランキング表示を強化
            scoreItem.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="rank-info">
                    <div class="player-name">${scoreData.player}</div>
                    <div class="player-team">${scoreData.team} - ${scoreData.date || '日付なし'}</div>
                </div>
                <div class="rank-score">${scoreData.score}点</div>
            `;
            
            scoresList.appendChild(scoreItem);
        });
    }
    
    // スコアの保存
    function saveScores() {
        localStorage.setItem('gameScores', JSON.stringify(scores));
    }
    
    // スコアの読み込み
    function loadScores() {
        const savedScores = localStorage.getItem('gameScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
            updateRanking(rankingFilter.value);
        }
    }
}); 