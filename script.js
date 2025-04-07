document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const playerNameInput = document.getElementById('player-name');
    const startButton = document.getElementById('start-button');
    const tapButton = document.getElementById('tap-button');
    const tapCount = document.getElementById('tap-count');
    const timer = document.getElementById('timer');
    const finalScore = document.getElementById('final-score');
    const playAgainButton = document.getElementById('play-again');
    const rankingList = document.getElementById('ranking-list');

    // ゲーム変数
    let count = 0;
    let timeLeft = 10;
    let gameInterval;
    let playerName = '';
    let rankings = [];

    // ローカルストレージからランキングを読み込む
    function loadRankings() {
        const savedRankings = localStorage.getItem('tapGameRankings');
        if (savedRankings) {
            rankings = JSON.parse(savedRankings);
        }
        displayRankings();
    }

    // ランキングを表示する
    function displayRankings() {
        rankingList.innerHTML = '';
        
        // ランキングをスコアの高い順にソート
        rankings.sort((a, b) => b.score - a.score);
        
        // 上位10位までを表示
        const topRankings = rankings.slice(0, 10);
        
        topRankings.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${entry.name}: ${entry.score}回`;
            
            // トップ3にはスタイルを追加
            if (index === 0) {
                li.style.color = 'gold';
                li.style.fontWeight = 'bold';
            } else if (index === 1) {
                li.style.color = 'silver';
                li.style.fontWeight = 'bold';
            } else if (index === 2) {
                li.style.color = '#cd7f32'; // bronze
                li.style.fontWeight = 'bold';
            }
            
            rankingList.appendChild(li);
        });
    }

    // ランキングに新しいスコアを追加
    function addToRankings(name, score) {
        rankings.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        // 重複する名前のエントリがある場合は最高スコアのみを残す
        const uniqueRankings = {};
        rankings.forEach(entry => {
            if (!uniqueRankings[entry.name] || uniqueRankings[entry.name].score < entry.score) {
                uniqueRankings[entry.name] = entry;
            }
        });
        
        rankings = Object.values(uniqueRankings);
        
        // ローカルストレージに保存
        localStorage.setItem('tapGameRankings', JSON.stringify(rankings));
        
        // ランキング表示を更新
        displayRankings();
    }

    // ゲーム開始
    function startGame() {
        playerName = playerNameInput.value.trim() || '名無しさん';
        
        // 画面の切り替え
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        
        // ゲーム変数の初期化
        count = 0;
        timeLeft = 10;
        tapCount.textContent = count;
        timer.textContent = timeLeft;
        
        // タイマーの開始
        gameInterval = setInterval(() => {
            timeLeft--;
            timer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // ゲーム終了
    function endGame() {
        clearInterval(gameInterval);
        
        // 結果画面の表示
        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        finalScore.textContent = count;
        
        // ランキングに追加
        addToRankings(playerName, count);
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startGame);
    
    tapButton.addEventListener('click', () => {
        if (timeLeft > 0) {
            count++;
            tapCount.textContent = count;
        }
    });
    
    playAgainButton.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        playerNameInput.value = playerName; // 前回のプレイヤー名を保持
    });

    // 初期ランキングのロード
    loadRankings();
}); 