document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const playerNameInput = document.getElementById('player-name');
    const startButton = document.getElementById('start-button');
    const playAgainButton = document.getElementById('play-again');
    const rankingList = document.getElementById('ranking-list');
    const gameCube = document.getElementById('game-cube');
    const cubeFaces = document.querySelectorAll('.cube-face');
    const controlButtons = document.querySelectorAll('.control-btn');
    const timerDisplay = document.getElementById('timer-value');
    const currentLevelDisplay = document.getElementById('current-level');
    const finalLevelDisplay = document.getElementById('final-level');
    const finalScoreDisplay = document.getElementById('final-score');
    const clearTimeDisplay = document.getElementById('clear-time');
    const progressDisplay = document.getElementById('progress');
    const codeSegmentsContainer = document.getElementById('code-segments');
    const codeSegments = document.querySelectorAll('.code-segment');
    const levelUpModal = document.getElementById('level-up-modal');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const missionResultDisplay = document.getElementById('mission-result');

    // ゲーム変数
    let playerName = '';
    let currentLevel = 1;
    let score = 0;
    let timeLeft = 60;
    let timer;
    let gameStartTime;
    let isGameActive = false;
    let currentCubeRotation = { x: -15, y: 15, z: 0 };
    let cubeSymbols = [];
    let collectedCodes = [];
    let targetCodes = [];
    let rankings = [];
    let gameData = {
        currentFace: 0, // 0:前, 1:右, 2:後, 3:左, 4:上, 5:下
        facesDiscovered: [false, false, false, false, false, false]
    };

    // キューブの回転状態を更新する関数
    function updateCubeRotation() {
        gameCube.style.transform = `rotateX(${currentCubeRotation.x}deg) rotateY(${currentCubeRotation.y}deg) rotateZ(${currentCubeRotation.z}deg)`;
    }

    // キューブを回転させる関数
    function rotateCube(direction) {
        switch(direction) {
            case 'up':
                currentCubeRotation.x += 90;
                if (gameData.currentFace === 0) gameData.currentFace = 4;
                else if (gameData.currentFace === 4) gameData.currentFace = 2;
                else if (gameData.currentFace === 2) gameData.currentFace = 5;
                else if (gameData.currentFace === 5) gameData.currentFace = 0;
                break;
            case 'down':
                currentCubeRotation.x -= 90;
                if (gameData.currentFace === 0) gameData.currentFace = 5;
                else if (gameData.currentFace === 5) gameData.currentFace = 2;
                else if (gameData.currentFace === 2) gameData.currentFace = 4;
                else if (gameData.currentFace === 4) gameData.currentFace = 0;
                break;
            case 'left':
                currentCubeRotation.y -= 90;
                if (gameData.currentFace === 0) gameData.currentFace = 1;
                else if (gameData.currentFace === 1) gameData.currentFace = 2;
                else if (gameData.currentFace === 2) gameData.currentFace = 3;
                else if (gameData.currentFace === 3) gameData.currentFace = 0;
                break;
            case 'right':
                currentCubeRotation.y += 90;
                if (gameData.currentFace === 0) gameData.currentFace = 3;
                else if (gameData.currentFace === 3) gameData.currentFace = 2;
                else if (gameData.currentFace === 2) gameData.currentFace = 1;
                else if (gameData.currentFace === 1) gameData.currentFace = 0;
                break;
        }
        updateCubeRotation();
        playRotateSound();
    }

    // サウンド効果
    function playRotateSound() {
        // ブラウザ互換性のためにWeb Audio APIを使用するか、単純なAudio要素を使用
        const audio = new Audio();
        audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAJxQBVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqrV1dXV1dXV1dXV1dXV1dXV/////////////////////wAAADJMQU1FMy45OXIBbgAAACAAAABTSU5HAAAATwAAAP/7kMQAAAZUAVl1AAAi6jLLrqFAAFYAAA9CcADLCMsMIDxP4ED/+Lnt+93vfwQIEEeBAYQf/8IODxCPB4fngg//gQIP//iEed//8QQQQ5TQK1Vt5NUAAACIBAAyQJOJmYxFTSxkIwRIWW22lqqoM0QodB/wYCHQl9wQEUwVG3ZiZXEhFn0j/G//6UXhLjw3//h2JZ4fPJxMI0xXV//HkRKU//j0JBcqG4BHiKxBSHUAAFADJEk4mGDMVNLGIjBEhqbbaWqqgzRCl0G/JgIdBn3JAQzBUbdmJlcSEUfSP8b//pReEuPDf/+HYlnh88nEwjTFc3/8eREpT/+PQkFyobgEeIAA';
        audio.volume = 0.3;
        audio.play();
    }

    function playSolveSound(success) {
        const audio = new Audio();
        if (success) {
            audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAHCAE1dAAAIvgwnLsEABBQQQAAP8AB3/gQOf/n+OIBDv5///CPB/+BAPwQD8Hg/gQHcCgACAAAmJlkgmpDKQKCCxdgYYKIUkMYAmSAJSGbIVJDkCGVz9AgZUr6Z+DMhEe////////9S5nMxMzO1Of///////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
        } else {
            audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAGlAFRdAAAIugwma6hAABQQQAAP8AB3/gQOf/n+OIBDv5///CPB/+BAPwQD8Hg/gQHcCgACAAAmZpkQnEhJQACCBiR90CjjjrBKkSJRr9QNYiVIyyrX//rVUaNf/jXWkBCRJA+QkZY1qrGJEiy7//+LkscoO7KupIySjz8JGG3//5bUWUG2UeWVx5UjisViv//86QeS71f//9rEikBEEAQJAEAQBAEhUROTEFNRTMuOTlyAW4AAAAAACAAAFNJT0cAAABPAAAA/w==';
        }
        audio.volume = 0.4;
        audio.play();
    }

    function playSuccessSound() {
        const audio = new Audio();
        audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAGgAFN1AAAIuozme6FAABQQAAAAQAAP/AAIPPPP+fP/B/mD//5g//B//BAHmCAPB/+YIAcwQAAgAATM0yITiAlIQDAgxI+6BRxV1glSJEsn9QNYiVIyyrX//rVUaNf/jXWkBCRJA+QkZY1qrGJEiy7//+LkscoO7KupIySjz8JGG3//5bUWUG2UeWVx5UjisViv//86QeS71f//9rEikBEiAQJAEAQBAEhUROTEFNRTMuOTlyAW4AAAAAACAAAFNJT0cAAABPAAAA/w==';
        audio.volume = 0.5;
        audio.play();
    }

    function playLevelUpSound() {
        const audio = new Audio();
        audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAGsAFJdAAAIvwwmO6FAABQQAAAAQAAP/AAIPPPP+fP/B/mD//5g//B//BAHmCAPB/+YIAcwQAAgAAmZpkQnEhJQACCBiR90CjjjrBKkSJRr9QNYiVIyyrX//rVUaNf/jXWkBCRJA+QkZY1qrGJEiy7//+LkscoO7KupIySjz8JGG3//5bUWUG2UeWVx5UjisViv//86QeS71f//9rEikBEEAQJAEAQBAEhUROTEFNRTMuOTlyAW4AAAAAACAAAFNJT0cAAABPAAAA/w==';
        audio.volume = 0.5;
        audio.play();
    }

    // キューブ面に暗号シンボルを設定する関数
    function generateCubeSymbols() {
        const symbolSets = [
            // レベル1のシンボルセット（簡単）
            ['①', '②', '③', '④', '⑤', '⑥'],
            // レベル2のシンボルセット（中間）
            ['㋐', '㋑', '㋒', '㋓', '㋔', '㋕'],
            // レベル3のシンボルセット（難しい）
            ['◆', '◇', '■', '□', '▲', '△'],
            // レベル4のシンボルセット（より難しい）
            ['♠', '♥', '♦', '♣', '★', '☆'],
            // レベル5のシンボルセット（最も難しい）
            ['α', 'β', 'γ', 'δ', 'ε', 'ζ']
        ];

        // 現在のレベルに応じたシンボルセットを選択（レベルの上限を考慮）
        const levelIndex = Math.min(currentLevel - 1, symbolSets.length - 1);
        cubeSymbols = [...symbolSets[levelIndex]];
        
        // シンボルをシャッフル
        shuffleArray(cubeSymbols);
        
        // ターゲットコードを生成（シンボルの順番をランダムに選択）
        targetCodes = [];
        const tempSymbols = [...cubeSymbols];
        shuffleArray(tempSymbols);
        targetCodes = tempSymbols.slice(0, 6);
        
        // キューブの各面にシンボルを設定
        cubeFaces.forEach((face, index) => {
            face.innerHTML = `<div class="cube-symbol">${cubeSymbols[index]}</div>`;
            
            // レベルに応じたパターンを追加
            if (currentLevel >= 2) {
                face.innerHTML += `<div class="cube-pattern level-${currentLevel}"></div>`;
            }
        });
        
        // 進捗状況とコードセグメントをリセット
        collectedCodes = [];
        updateProgress();
        codeSegments.forEach(segment => {
            segment.textContent = '?';
            segment.classList.remove('collected');
        });
        
        // 面の発見状態をリセット
        gameData.facesDiscovered = [false, false, false, false, false, false];
    }

    // 配列をシャッフルする関数
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 解読ボタンの処理
    function solveCubeFace() {
        const currentFaceIndex = gameData.currentFace;
        
        // この面がまだ発見されていない場合
        if (!gameData.facesDiscovered[currentFaceIndex]) {
            // この面を発見済みにマーク
            gameData.facesDiscovered[currentFaceIndex] = true;
            
            // 見つけたシンボルをコレクションに追加
            const discoveredSymbol = cubeSymbols[currentFaceIndex];
            collectedCodes.push(discoveredSymbol);
            
            // コードセグメントの表示を更新
            const index = collectedCodes.length - 1;
            if (index < codeSegments.length) {
                codeSegments[index].textContent = discoveredSymbol;
                codeSegments[index].classList.add('collected');
                
                // ターゲットコードと一致するかチェック
                const isCorrect = targetCodes[index] === discoveredSymbol;
                
                // 正解エフェクト
                if (isCorrect) {
                    codeSegments[index].style.color = 'var(--success-color)';
                    playSolveSound(true);
                    score += 100 * currentLevel;
                } else {
                    codeSegments[index].style.color = 'var(--failure-color)';
                    playSolveSound(false);
                }
            }
            
            // 進捗状況の更新
            updateProgress();
            
            // すべての面を発見したかチェック
            if (collectedCodes.length === 6) {
                handleLevelCompletion();
            }
        } else {
            // すでに発見済みの面
            playSolveSound(false);
        }
    }

    // 進捗状況を更新する関数
    function updateProgress() {
        progressDisplay.textContent = `${collectedCodes.length}/6`;
    }

    // レベル完了処理
    function handleLevelCompletion() {
        clearInterval(timer);
        
        // 次のレベルに進むかゲーム終了するか
        if (currentLevel < 5) {
            // レベルアップモーダルを表示
            playLevelUpSound();
            levelUpModal.classList.remove('hidden');
        } else {
            // ゲーム完了
            endGame(true);
        }
    }

    // 次のレベルに進む処理
    function goToNextLevel() {
        currentLevel++;
        levelUpModal.classList.add('hidden');
        
        // レベル表示を更新
        currentLevelDisplay.textContent = currentLevel;
        
        // 新しいシンボルを生成
        generateCubeSymbols();
        
        // タイマーをリセット（レベルごとに少し短く）
        timeLeft = Math.max(20, 60 - (currentLevel - 1) * 10);
        timerDisplay.textContent = timeLeft;
        
        // タイマーを再開
        startTimer();
    }

    // タイマーを開始する関数
    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 10) {
                timerDisplay.style.color = 'var(--failure-color)';
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                endGame(false);
            }
        }, 1000);
    }

    // ゲーム終了処理
    function endGame(success) {
        isGameActive = false;
        clearInterval(timer);
        
        // ゲーム画面を隠して結果画面を表示
        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        // 経過時間を計算
        const gameEndTime = new Date();
        const timeDiff = Math.floor((gameEndTime - gameStartTime) / 1000);
        const minutes = Math.floor(timeDiff / 60).toString().padStart(2, '0');
        const seconds = (timeDiff % 60).toString().padStart(2, '0');
        
        // ミッション成功か失敗かを表示
        if (success) {
            missionResultDisplay.textContent = '完了';
            missionResultDisplay.style.color = 'var(--success-color)';
            playSuccessSound();
        } else {
            missionResultDisplay.textContent = '失敗';
            missionResultDisplay.style.color = 'var(--failure-color)';
        }
        
        // スコアと時間を表示
        clearTimeDisplay.textContent = `${minutes}:${seconds}`;
        finalScoreDisplay.textContent = score;
        finalLevelDisplay.textContent = currentLevel;
        
        // ランキングに追加
        addToRankings(playerName, currentLevel, score);
    }

    // ローカルストレージからランキングを読み込む
    function loadRankings() {
        const savedRankings = localStorage.getItem('cubeGameRankings');
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
            const tr = document.createElement('tr');
            
            const rankTd = document.createElement('td');
            rankTd.textContent = index + 1;
            
            const nameTd = document.createElement('td');
            nameTd.textContent = entry.name;
            
            const levelTd = document.createElement('td');
            levelTd.textContent = entry.level;
            
            const scoreTd = document.createElement('td');
            scoreTd.textContent = entry.score;
            
            tr.appendChild(rankTd);
            tr.appendChild(nameTd);
            tr.appendChild(levelTd);
            tr.appendChild(scoreTd);
            
            rankingList.appendChild(tr);
        });
    }

    // ランキングに新しいスコアを追加
    function addToRankings(name, level, score) {
        rankings.push({
            name: name,
            level: level,
            score: score,
            date: new Date().toISOString()
        });
        
        // ローカルストレージに保存
        localStorage.setItem('cubeGameRankings', JSON.stringify(rankings));
        
        // ランキング表示を更新
        displayRankings();
    }

    // ゲーム初期化
    function initGame() {
        playerName = playerNameInput.value.trim() || 'エージェントX';
        
        // 画面の切り替え
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        
        // ゲーム変数の初期化
        currentLevel = 1;
        score = 0;
        timeLeft = 60;
        currentLevelDisplay.textContent = currentLevel;
        timerDisplay.textContent = timeLeft;
        timerDisplay.style.color = 'var(--primary-color)';
        
        // キューブの初期化
        currentCubeRotation = { x: -15, y: 15, z: 0 };
        updateCubeRotation();
        gameData.currentFace = 0;
        
        // シンボル生成
        generateCubeSymbols();
        
        // ゲーム開始時間を記録
        gameStartTime = new Date();
        isGameActive = true;
        
        // タイマー開始
        startTimer();
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', initGame);
    
    playAgainButton.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
    
    nextLevelBtn.addEventListener('click', goToNextLevel);
    
    controlButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isGameActive) {
                const direction = button.getAttribute('data-direction');
                if (direction === 'solve') {
                    solveCubeFace();
                } else {
                    rotateCube(direction);
                }
            }
        });
    });

    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (isGameActive) {
            switch(e.key) {
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
                case ' ':
                case 'Enter':
                    solveCubeFace();
                    break;
            }
        }
    });

    // ゲーム開始時の初期化
    loadRankings();
}); 