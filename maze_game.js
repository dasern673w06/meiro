document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const messageDiv = document.getElementById('message');

    // コントロールボタンの取得
    const upButton = document.getElementById('up');
    const downButton = document.getElementById('down');
    const leftButton = document.getElementById('left');
    const rightButton = document.getElementById('right');

    // ゲーム設定
    const mazeWidth = 21;
    const mazeHeight = 21;
    const cellSize = canvas.width / mazeWidth;
    const enemyCount = 3;
    const enemyMoveInterval = 1000;
    const appleCount = 5;

    let maze = [];
    let player = { x: 1, y: 1 };
    let goal = { x: mazeWidth - 2, y: mazeHeight - 2 };
    let enemies = [];
    let apples = [];
    let score = 0;
    let gameActive = true;

    // 画像の読み込み
    const appleImage = new Image();
    appleImage.src = 'ringo.png';

    // 迷路の初期化
    function initMaze() {
        maze = [];
        for (let y = 0; y < mazeHeight; y++) {
            maze[y] = [];
            for (let x = 0; x < mazeWidth; x++) {
                maze[y][x] = 1;
            }
        }
    }

    // 迷路の自動生成（バックトラッキング法）
    function generateMaze(startX, startY) {
        let stack = [{ x: startX, y: startY }];
        maze[startY][startX] = 0;

        while (stack.length > 0) {
            let current = stack.pop();
            let x = current.x;
            let y = current.y;

            let directions = [[0, 2], [0, -2], [2, 0], [-2, 0]];
            directions.sort(() => Math.random() - 0.5);

            for (let [dx, dy] of directions) {
                let nextX = x + dx;
                let nextY = y + dy;

                if (nextX > 0 && nextX < mazeWidth - 1 && nextY > 0 && nextY < mazeHeight - 1 && maze[nextY][nextX] === 1) {
                    maze[nextY][nextX] = 0;
                    maze[y + dy / 2][x + dx / 2] = 0;
                    stack.push({ x: nextX, y: nextY });
                }
            }
        }
    }

    // 敵の初期化
    function initEnemies() {
        enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            let enemy;
            do {
                enemy = {
                    x: Math.floor(Math.random() * (mazeWidth - 2)) + 1,
                    y: Math.floor(Math.random() * (mazeHeight - 2)) + 1
                };
            } while (maze[enemy.y][enemy.x] === 1 || (enemy.x === 1 && enemy.y === 1) || (enemy.x === goal.x && enemy.y === goal.y) || isEnemyTooClose(enemy));
            enemies.push(enemy);
        }
    }

    function isEnemyTooClose(newEnemy) {
        for (const existingEnemy of enemies) {
            if (Math.abs(newEnemy.x - existingEnemy.x) < 3 && Math.abs(newEnemy.y - existingEnemy.y) < 3) {
                return true;
            }
        }
        return false;
    }

    // リンゴの初期化
    function initApples() {
        apples = [];
        for (let i = 0; i < appleCount; i++) {
            let apple;
            do {
                apple = {
                    x: Math.floor(Math.random() * (mazeWidth - 2)) + 1,
                    y: Math.floor(Math.random() * (mazeHeight - 2)) + 1
                };
            } while (maze[apple.y][apple.x] === 1 || (apple.x === 1 && apple.y === 1) || (apple.x === goal.x && apple.y === goal.y));
            apples.push(apple);
        }
    }

    // 敵の移動
    function moveEnemies() {
        if (!gameActive) return;
        enemies.forEach(enemy => {
            let possibleMoves = [];
            const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dx, dy] of directions) {
                const newX = enemy.x + dx;
                const newY = enemy.y + dy;
                if (newX > 0 && newX < mazeWidth - 1 && newY > 0 && newY < mazeHeight - 1 && maze[newY][newX] === 0) {
                    possibleMoves.push({ x: newX, y: newY });
                }
            }
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                enemy.x = randomMove.x;
                enemy.y = randomMove.y;
            }
        });
        draw();
        checkCollision();
    }

    // ゲームの描画
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 迷路
        for (let y = 0; y < mazeHeight; y++) {
            for (let x = 0; x < mazeWidth; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }

        // ゴール
        ctx.fillStyle = 'red';
        ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);

        // リンゴ
        apples.forEach(apple => {
            ctx.drawImage(appleImage, apple.x * cellSize, apple.y * cellSize, cellSize, cellSize);
        });

        // 敵
        ctx.fillStyle = 'purple';
        enemies.forEach(enemy => {
            ctx.beginPath();
            ctx.arc(enemy.x * cellSize + cellSize / 2, enemy.y * cellSize + cellSize / 2, cellSize / 2 * 0.8, 0, 2 * Math.PI);
            ctx.fill();
        });

        // プレイヤー
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize / 2 * 0.8, 0, 2 * Math.PI);
        ctx.fill();
    }

    // プレイヤーの移動
    function movePlayer(dx, dy) {
        if (!gameActive) return;
        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newX > 0 && newX < mazeWidth - 1 && newY > 0 && newY < mazeHeight - 1 && maze[newY][newX] === 0) {
            player.x = newX;
            player.y = newY;
            checkApple();
            draw();
            checkWin();
            checkCollision();
        }
    }

    // リンゴの取得判定
    function checkApple() {
        apples = apples.filter(apple => {
            if (player.x === apple.x && player.y === apple.y) {
                score++;
                messageDiv.textContent = `スコア: ${score}`;
                return false;
            }
            return true;
        });
    }

    // 衝突判定
    function checkCollision() {
        for (const enemy of enemies) {
            if (player.x === enemy.x && player.y === enemy.y) {
                gameActive = false;
                messageDiv.textContent = `ゲームオーバー！最終スコア: ${score}`;
                setTimeout(() => {
                    resetGame();
                }, 3000);
                return;
            }
        }
    }

    // 勝利判定
    function checkWin() {
        if (player.x === goal.x && player.y === goal.y && gameActive) {
            gameActive = false;
            messageDiv.textContent = `ゴール！おめでとう！現在のスコア: ${score}`;
            setTimeout(() => {
                nextGame();
            }, 3000);
        }
    }

    // 次のゲーム開始
    function nextGame() {
        gameActive = true;
        messageDiv.textContent = `スコア: ${score} - 矢印キーで動かしてリンゴをゲット！`;
        initMaze();
        generateMaze(1, 1);
        initEnemies();
        initApples();
        player = { x: 1, y: 1 };
        draw();
        clearInterval(enemyInterval);
        enemyInterval = setInterval(moveEnemies, enemyMoveInterval);
    }

    // ゲームのリセット（初期スコアに戻す）
    function resetGame() {
        score = 0;
        nextGame();
    }

    // キー入力の処理 (変更なし)
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        switch (e.key) {
            case 'ArrowUp':
                movePlayer(0, -1);
                break;
            case 'ArrowDown':
                movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                movePlayer(-1, 0);
                break;
            case 'ArrowRight':
                movePlayer(1, 0);
                break;
        }
    });

    // タッチボタンのイベントリスナーを追加
    upButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // スクロールを防ぐ
        movePlayer(0, -1);
    });
    downButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer(0, 1);
    });
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer(-1, 0);
    });
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer(1, 0);
    });
    
    // PCでのクリック操作にも対応
    upButton.addEventListener('click', () => movePlayer(0, -1));
    downButton.addEventListener('click', () => movePlayer(0, 1));
    leftButton.addEventListener('click', () => movePlayer(-1, 0));
    rightButton.addEventListener('click', () => movePlayer(1, 0));

    let enemyInterval;
    nextGame();
});
