document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const gameArea = document.getElementById('game-area');
    const scoresList = document.getElementById('scores');
    
    // ゲームの状態管理
    let gameActive = false;
    let scores = [];
    let currentPlayer = '';
    
    // ゲーム開始イベント
    startBtn.addEventListener('click', () => {
        if (!gameActive) {
            startGame();
        }
    });
    
    // リセットイベント
    resetBtn.addEventListener('click', () => {
        resetGame();
    });
    
    // ゲーム開始関数
    function startGame() {
        gameActive = true;
        currentPlayer = prompt('あなたの名前を入力してください:');
        if (!currentPlayer) {
            currentPlayer = '名無しさん';
        }
        
        gameArea.innerHTML = `
            <h3>${currentPlayer}さん、ゲームを始めましょう！</h3>
            <div class="game-play">
                <p>クリックしてポイントを獲得しましょう！</p>
                <div id="click-target" class="click-target">クリック!</div>
                <p>得点: <span id="current-score">0</span></p>
                <button id="end-game" class="btn">ゲーム終了</button>
            </div>
        `;
        
        // クリックターゲットの設定
        const clickTarget = document.getElementById('click-target');
        const currentScoreDisplay = document.getElementById('current-score');
        const endGameBtn = document.getElementById('end-game');
        
        let playerScore = 0;
        
        clickTarget.addEventListener('click', () => {
            playerScore += 1;
            currentScoreDisplay.textContent = playerScore;
            
            // ターゲットの位置をランダムに変更
            const maxX = gameArea.clientWidth - clickTarget.clientWidth;
            const maxY = gameArea.clientHeight - clickTarget.clientHeight;
            
            clickTarget.style.left = Math.floor(Math.random() * maxX) + 'px';
            clickTarget.style.top = Math.floor(Math.random() * maxY) + 'px';
        });
        
        // ゲーム終了イベント
        endGameBtn.addEventListener('click', () => {
            endGame(playerScore);
        });
        
        // CSSの追加
        const style = document.createElement('style');
        style.textContent = `
            .game-play {
                position: relative;
                width: 100%;
                height: 250px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
            }
            
            .click-target {
                position: absolute;
                width: 80px;
                height: 80px;
                background-color: #e74c3c;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
            
            .click-target:hover {
                background-color: #c0392b;
                transform: translate(-50%, -50%) scale(1.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    // ゲーム終了関数
    function endGame(finalScore) {
        gameActive = false;
        
        // スコアの保存
        scores.push({
            player: currentPlayer,
            score: finalScore
        });
        
        // スコアを降順でソート
        scores.sort((a, b) => b.score - a.score);
        
        // 結果表示
        updateScoreBoard();
        
        gameArea.innerHTML = `
            <h3>ゲーム終了！</h3>
            <p>${currentPlayer}さんの得点: ${finalScore}点</p>
            <p>もう一度プレイするには「ゲーム開始」ボタンを押してください</p>
        `;
    }
    
    // リセット関数
    function resetGame() {
        gameActive = false;
        scores = [];
        updateScoreBoard();
        
        gameArea.innerHTML = `
            <p>ゲームを開始するには「ゲーム開始」ボタンを押してください</p>
        `;
    }
    
    // スコアボード更新関数
    function updateScoreBoard() {
        scoresList.innerHTML = '';
        
        if (scores.length === 0) {
            scoresList.innerHTML = '<li>まだ記録がありません</li>';
            return;
        }
        
        scores.forEach((scoreData, index) => {
            const scoreItem = document.createElement('li');
            scoreItem.textContent = `${index + 1}位: ${scoreData.player} - ${scoreData.score}点`;
            scoresList.appendChild(scoreItem);
        });
    }
}); 