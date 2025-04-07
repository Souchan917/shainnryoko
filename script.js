document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const levelModal = document.getElementById('level-modal');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const playerNameInput = document.getElementById('player-name');
    const levelDisplay = document.getElementById('level');
    const timeDisplay = document.getElementById('time');
    const codeSegments = document.querySelectorAll('.code-segment');
    const controlButtons = document.querySelectorAll('.control-btn');
    const cube = document.querySelector('.cube');
    const missionResultDisplay = document.getElementById('mission-result');
    const finalScoreDisplay = document.getElementById('final-score');
    const clearTimeDisplay = document.getElementById('clear-time');
    const finalLevelDisplay = document.getElementById('final-level');
    const completedLevelDisplay = document.getElementById('completed-level');
    const timeBonusDisplay = document.getElementById('time-bonus');
    const levelBonusDisplay = document.getElementById('level-bonus');
    const rankingList = document.getElementById('ranking-list');
    const failureMessage = document.getElementById('failure-message');
    const onsenBubblesContainer = document.querySelector('.onsen-bubbles');

    // ゲーム状態
    let gameState = {
        playerName: '',
        level: 1,
        score: 0,
        time: 60,
        collectedCodes: [],
        cubeRotation: { x: -15, y: 15, z: 0 },
        gameActive: false,
        timer: null,
        startTime: 0,
        elapsedTime: 0
    };

    // キューブシンボル（レベルごとに変わる）
    const levelSymbols = [
        // レベル1
        { front: '温', back: '死', right: '湯', left: '命', top: '泉', bottom: '罠' },
        // レベル2
        { front: '闇', back: '忍', right: '宿', left: '鬼', top: '殺', bottom: '落' },
        // レベル3
        { front: '業', back: '怨', right: '霧', left: '縛', top: '惨', bottom: '骸' },
        // レベル4
        { front: '絶', back: '滅', right: '呪', left: '断', top: '焦', bottom: '血' },
        // レベル5
        { front: '獄', back: '冥', right: '崩', left: '闘', top: '壊', bottom: '終' }
    ];

    // コード（レベルごとに変わる）
    const levelCodes = [
        ['7', '3', '9', '2'],
        ['A', '4', 'F', '1'],
        ['B', '5', 'D', '8'],
        ['E', '0', '6', 'C'],
        ['死', '命', '罠', '生']
    ];

    // ランキングデータ
    let rankings = [
        { name: 'たろう', score: 5240, level: 5, time: 243 },
        { name: 'はなこ', score: 4120, level: 4, time: 198 },
        { name: 'ゆうた', score: 3600, level: 3, time: 176 },
        { name: 'まりこ', score: 2800, level: 3, time: 203 },
        { name: 'けんた', score: 2200, level: 2, time: 154 },
        { name: 'あきら', score: 1950, level: 2, time: 167 },
        { name: 'さとし', score: 1500, level: 2, time: 189 },
        { name: 'みさき', score: 1200, level: 1, time: 132 },
        { name: 'ようこ', score: 980, level: 1, time: 145 },
        { name: 'かずき', score: 750, level: 1, time: 156 }
    ];

    // 温泉の泡エフェクトを作成
    function createOnsenBubbles() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.classList.add('onsen-bubble');
                
                // ランダムなサイズと位置
                const size = Math.random() * 30 + 10; // 10px〜40px
                const left = Math.random() * 100; // 0%〜100%
                
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${left}%`;
                bubble.style.bottom = '-20px';
                bubble.style.animationDuration = `${Math.random() * 8 + 4}s`; // 4s〜12s
                
                onsenBubblesContainer.appendChild(bubble);
                
                // アニメーション終了後に要素を削除
                bubble.addEventListener('animationend', () => {
                    bubble.remove();
                });
            }, i * 800); // 時間差を付けて泡を発生
        }
    }

    // 血の滴り効果
    function createBloodDrop() {
        const container = document.querySelector('.container');
        const drop = document.createElement('div');
        drop.classList.add('death-drop');
        
        // ランダムな位置
        const left = Math.random() * 100;
        drop.style.left = `${left}%`;
        
        container.appendChild(drop);
        
        // アニメーション終了後に要素を削除
        drop.addEventListener('animationend', () => {
            drop.remove();
        });
    }

    // 定期的に血の滴りを生成
    function startBloodDrops() {
        return setInterval(() => {
            if (Math.random() > 0.7) { // 30%の確率で血滴を生成
                createBloodDrop();
            }
        }, 3000);
    }

    // ゲーム開始準備
    function prepareGame() {
        gameState.playerName = playerNameInput.value.trim() || '名無し';
        gameState.level = 1;
        gameState.score = 0;
        gameState.time = 60;
        gameState.collectedCodes = [];
        gameState.cubeRotation = { x: -15, y: 15, z: 0 };
        gameState.gameActive = true;
        gameState.startTime = Date.now();
        
        // 表示を更新
        updateLevelDisplay();
        updateTimeDisplay();
        updateCubeSymbols();
        resetCodeSegments();
        
        // 画面切り替え
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        failureMessage.classList.add('hidden');
        
        // タイマー開始
        startTimer();
        
        // 温泉の泡エフェクト開始
        createOnsenBubbles();
        setInterval(createOnsenBubbles, 10000);
        
        // 血の滴りエフェクト開始
        startBloodDrops();
    }

    // タイマー開始
    function startTimer() {
        clearInterval(gameState.timer);
        gameState.timer = setInterval(() => {
            gameState.time--;
            updateTimeDisplay();
            
            // 時間切れの場合
            if (gameState.time <= 0) {
                endGame(false);
            }
            
            // 残り時間が10秒以下になったら警告表示
            if (gameState.time <= 10) {
                timeDisplay.style.color = 'var(--death-red)';
                timeDisplay.style.animation = 'timerPulse 0.5s infinite';
            }
        }, 1000);
    }

    // レベル表示更新
    function updateLevelDisplay() {
        levelDisplay.textContent = gameState.level;
    }

    // 時間表示更新
    function updateTimeDisplay() {
        timeDisplay.textContent = gameState.time;
    }

    // キューブシンボル更新
    function updateCubeSymbols() {
        const symbols = levelSymbols[gameState.level - 1];
        document.getElementById('front-symbol').textContent = symbols.front;
        document.getElementById('back-symbol').textContent = symbols.back;
        document.getElementById('right-symbol').textContent = symbols.right;
        document.getElementById('left-symbol').textContent = symbols.left;
        document.getElementById('top-symbol').textContent = symbols.top;
        document.getElementById('bottom-symbol').textContent = symbols.bottom;
    }

    // コードセグメントリセット
    function resetCodeSegments() {
        codeSegments.forEach(segment => {
            segment.textContent = '?';
            segment.classList.remove('collected');
        });
    }

    // キューブ回転
    function rotateCube(direction) {
        switch (direction) {
            case 'up':
                gameState.cubeRotation.x -= 90;
                break;
            case 'down':
                gameState.cubeRotation.x += 90;
                break;
            case 'left':
                gameState.cubeRotation.y -= 90;
                break;
            case 'right':
                gameState.cubeRotation.y += 90;
                break;
            case 'rotate-x':
                gameState.cubeRotation.x += 45;
                break;
            case 'rotate-y':
                gameState.cubeRotation.y += 45;
                break;
            case 'rotate-z':
                gameState.cubeRotation.z += 45;
                break;
        }
        
        cube.style.transform = `rotateX(${gameState.cubeRotation.x}deg) rotateY(${gameState.cubeRotation.y}deg) rotateZ(${gameState.cubeRotation.z}deg)`;
        
        // コード発見の可能性
        if (Math.random() > 0.7) {
            discoverCode();
        }
    }

    // コード発見
    function discoverCode() {
        if (gameState.collectedCodes.length >= 4) return;
        
        const codes = levelCodes[gameState.level - 1];
        let newCode;
        do {
            newCode = codes[Math.floor(Math.random() * codes.length)];
        } while (gameState.collectedCodes.includes(newCode));
        
        gameState.collectedCodes.push(newCode);
        
        // 表示更新
        codeSegments[gameState.collectedCodes.length - 1].textContent = newCode;
        codeSegments[gameState.collectedCodes.length - 1].classList.add('collected');
        
        // すべてのコード収集時、血の滴り効果を表示
        if (gameState.collectedCodes.length === 4) {
            document.querySelectorAll('.cube-face').forEach(face => {
                face.classList.add('solved');
            });
        }
    }

    // キューブを解く
    function solveCube() {
        if (gameState.collectedCodes.length < 4) {
            // コードが足りない場合の警告
            alert('すべてのコードを集めてください！');
            return;
        }
        
        // レベルクリア処理
        clearInterval(gameState.timer);
        const timeBonus = gameState.time * 10;
        const levelBonus = gameState.level * 100;
        gameState.score += timeBonus + levelBonus;
        
        // レベルモーダル表示
        completedLevelDisplay.textContent = gameState.level;
        timeBonusDisplay.textContent = gameState.time;
        levelBonusDisplay.textContent = levelBonus;
        levelModal.classList.remove('hidden');
        
        // 効果音や演出をここに追加
    }

    // 次のレベルへ
    function nextLevel() {
        gameState.level++;
        gameState.time = 60 - ((gameState.level - 1) * 5); // レベルが上がるごとに制限時間が減少
        gameState.collectedCodes = [];
        
        // キューブの面から血の滴り効果を削除
        document.querySelectorAll('.cube-face').forEach(face => {
            face.classList.remove('solved');
        });
        
        // 最終レベルをクリアした場合
        if (gameState.level > levelSymbols.length) {
            endGame(true);
            return;
        }
        
        // 表示を更新
        updateLevelDisplay();
        updateTimeDisplay();
        updateCubeSymbols();
        resetCodeSegments();
        
        // モーダルを閉じる
        levelModal.classList.add('hidden');
        
        // タイマー再開
        startTimer();
        
        // 難易度を上げるための追加効果
        if (gameState.level >= 3) {
            // キューブがときどき自動で回転するなどの難易度調整
            setInterval(() => {
                if (Math.random() > 0.8 && gameState.gameActive) {
                    const directions = ['up', 'down', 'left', 'right'];
                    rotateCube(directions[Math.floor(Math.random() * directions.length)]);
                }
            }, 5000);
        }
    }

    // ゲーム終了
    function endGame(isSuccess) {
        clearInterval(gameState.timer);
        gameState.gameActive = false;
        gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        
        // 失敗メッセージ表示（時間切れの場合）
        if (!isSuccess) {
            failureMessage.classList.remove('hidden');
            setTimeout(() => {
                // 一定時間後に結果画面へ
                showResults(isSuccess);
            }, 3000);
        } else {
            showResults(isSuccess);
        }
    }

    // 結果表示
    function showResults(isSuccess) {
        missionResultDisplay.textContent = isSuccess ? '成功' : '失敗';
        missionResultDisplay.style.color = isSuccess ? 'var(--success-color)' : 'var(--failure-color)';
        finalScoreDisplay.textContent = gameState.score;
        clearTimeDisplay.textContent = gameState.elapsedTime;
        finalLevelDisplay.textContent = gameState.level;
        
        // ランキング更新
        if (isSuccess || gameState.score > 0) {
            updateRankings();
        }
        
        // 画面切り替え
        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }

    // ランキング更新
    function updateRankings() {
        const newRank = {
            name: gameState.playerName,
            score: gameState.score,
            level: gameState.level,
            time: gameState.elapsedTime
        };
        
        rankings.push(newRank);
        rankings.sort((a, b) => b.score - a.score);
        
        if (rankings.length > 10) {
            rankings = rankings.slice(0, 10);
        }
        
        displayRankings();
    }

    // ランキング表示
    function displayRankings() {
        rankingList.innerHTML = '';
        
        rankings.forEach((rank, index) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = rank.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = rank.score;
            
            const levelCell = document.createElement('td');
            levelCell.textContent = rank.level;
            
            const timeCell = document.createElement('td');
            timeCell.textContent = `${rank.time}秒`;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(levelCell);
            row.appendChild(timeCell);
            
            rankingList.appendChild(row);
        });
    }

    // イベントリスナー設定
    startBtn.addEventListener('click', prepareGame);
    restartBtn.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
    nextLevelBtn.addEventListener('click', nextLevel);
    
    controlButtons.forEach(button => {
        button.addEventListener('click', () => {
            const direction = button.getAttribute('data-direction');
            
            if (direction === 'solve') {
                solveCube();
            } else {
                rotateCube(direction);
            }
        });
    });

    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (!gameState.gameActive) return;
        
        switch (e.key) {
            case 'ArrowUp':
                rotateCube('up');
                break;
            case 'ArrowDown':
                rotateCube('down');
                break;
            case 'ArrowLeft':
                rotateCube('left');
                break;
            case 'ArrowRight':
                rotateCube('right');
                break;
            case 'x':
                rotateCube('rotate-x');
                break;
            case 'y':
                rotateCube('rotate-y');
                break;
            case 'z':
                rotateCube('rotate-z');
                break;
            case 'Enter':
                solveCube();
                break;
        }
    });

    // 初期ランキング表示
    displayRankings();
    
    // 血の滴りエフェクトを定期的に生成
    const bloodInterval = startBloodDrops();

    // 定期的に温泉の泡を生成
    createOnsenBubbles();
    setInterval(createOnsenBubbles, 10000);
}); 