const mario = document.getElementById("mario");
const item = document.getElementById("item");
const gameContainer = document.getElementById("game-container");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const currentPlayerDisplay = document.getElementById("current-player-display");

const startMenu = document.getElementById("start-menu");
const gameOverScreen = document.getElementById("game-over-screen");
const settingsModal = document.getElementById("settings-modal");
const rulesModal = document.getElementById("rules-modal");
const nameModal = document.getElementById("name-modal");

const playerNameInput = document.getElementById("player-name-input");
const nameModalTitle = document.getElementById("name-modal-title");
const savedNamePreview = document.getElementById("saved-name-preview");
const changeNameBtn = document.getElementById("change-name-btn");
const cancelNameBtn = document.getElementById("cancel-name-btn");

const finalPlayerName = document.getElementById("final-player-name");
const finalScoreDisplay = document.getElementById("final-score");
const gameStatusTitle = document.getElementById("game-status-title");
const soundToggleBtn = document.getElementById("sound-toggle-btn");
const restartInSettingsBtn = document.getElementById("restart-in-settings");
const touchJumpBtn = document.getElementById("touch-jump-btn");

const bgm = document.getElementById("bgm");
const jumpSound = document.getElementById("jump-sound");
const hitSound = document.getElementById("hit-sound");
const collectSound = document.getElementById("collect-sound");

let playerName = localStorage.getItem("mario_last_player_name") || "";
let score = 0;
let timeLeft = 60;
let lives = 3;
let isJumping = false;
let isGameOver = true;
let isPaused = false;
let isInvincible = false;
let isMuted = false;
let currentVolume = 0.5;

let obstacleTimeout = null;
let obstacleTimeoutsList = [];
let itemInterval = null;
let gameTimer = null;
let scoreTimer = null;
let collisionCheck = null;
let itemCollisionCheck = null;

let highScores = JSON.parse(localStorage.getItem("mario_high_scores_v2")) || [];

applyVolume(currentVolume);
updateLeaderboardUI();
checkInitialPlayerName();

function checkInitialPlayerName() {
    if (playerName !== "") {
        savedNamePreview.innerText = playerName;
        changeNameBtn.classList.remove("hidden");
    } else {
        changeNameBtn.classList.add("hidden");
    }
}

function handleStartButtonClick() {
    if (playerName !== "") {
        startMenu.classList.add("hidden");
        restartGame();
    } else {
        openNameInputModal();
    }
}

function openNameInputModal() {
    playerNameInput.value = playerName;
    
    if (playerName !== "") {
        nameModalTitle.innerText = "✏️ แก้ไขชื่อผู้เล่น";
        cancelNameBtn.classList.remove("hidden");
    } else {
        nameModalTitle.innerText = "👤 กรอกชื่อผู้เล่น";
        cancelNameBtn.classList.add("hidden");
    }
    
    nameModal.classList.remove("hidden");
}

function closeNameInputModal() {
    nameModal.classList.add("hidden");
}

function confirmNameInput() {
    const inputVal = playerNameInput.value.trim();
    const finalName = inputVal !== "" ? inputVal : "ผู้เล่น";
    
    playerName = finalName;
    localStorage.setItem("mario_last_player_name", playerName);
    
    savedNamePreview.innerText = playerName;
    changeNameBtn.classList.remove("hidden");
    closeNameInputModal();

    if (startMenu.classList.contains("hidden") === false && isGameOver) {
        startMenu.classList.add("hidden");
        restartGame();
    }
}

function applyVolume(vol) {
    bgm.volume = vol;
    jumpSound.volume = vol;
    hitSound.volume = vol;
    collectSound.volume = vol;
}

function changeVolume(val) {
    currentVolume = parseFloat(val);
    applyVolume(currentVolume);
    
    if (currentVolume === 0) {
        isMuted = true;
        soundToggleBtn.innerText = "🔇 ปิดเสียง";
    } else {
        isMuted = false;
        soundToggleBtn.innerText = "🔊 เปิดเสียง";
    }
}

function toggleSound() {
    isMuted = !isMuted;
    bgm.muted = isMuted;
    jumpSound.muted = isMuted;
    hitSound.muted = isMuted;
    collectSound.muted = isMuted;

    soundToggleBtn.innerText = isMuted ? "🔇 ปิดเสียง" : "🔊 เปิดเสียง";
    if (!isMuted && !isGameOver && !isPaused) bgm.play().catch(() => {});
}

function openRules() {
    rulesModal.classList.remove("hidden");
}

function closeRules() {
    rulesModal.classList.add("hidden");
}

function openSettings() {
    if (!isGameOver) {
        pauseGame();
        restartInSettingsBtn.classList.remove("hidden");
    } else {
        restartInSettingsBtn.classList.add("hidden");
    }
    settingsModal.classList.remove("hidden");
}

function closeSettings() {
    settingsModal.classList.add("hidden");
    if (!isGameOver && isPaused) {
        resumeGame();
    }
}

function returnToMainMenu() {
    gameOverScreen.classList.add("hidden");
    startMenu.classList.remove("hidden");
    checkInitialPlayerName();
    updateLeaderboardUI();
}

function pauseGame() {
    if (isGameOver || isPaused) return;

    isPaused = true;
    bgm.pause();
    
    mario.classList.add("paused");
    item.classList.add("paused");

    document.querySelectorAll(".obstacle-dynamic").forEach((obs) => {
        const computedStyle = window.getComputedStyle(obs);
        obs.style.right = computedStyle.getPropertyValue("right");
        obs.classList.add("paused");
    });
}

function resumeGame() {
    if (isGameOver || !isPaused) return;

    isPaused = false;
    if (!isMuted) bgm.play().catch(() => {});

    mario.classList.remove("paused");
    item.classList.remove("paused");

    document.querySelectorAll(".obstacle-dynamic").forEach((obs) => {
        obs.classList.remove("paused");
        const currentRightVal = parseFloat(obs.style.right) || 0;
        const remainingDistance = 1150 - currentRightVal;
        const remainingTime = (remainingDistance / 1270) * 1.8;

        if (remainingTime > 0) {
            obs.style.transition = `right ${remainingTime}s linear`;
            obs.style.right = "1150px";
        }
    });
}

// ควบคุมการกระโดดด้วยคีย์บอร์ด
document.addEventListener("keydown", (e) => {
    if ((e.code === "ArrowUp" || e.code === "Space") && !isGameOver && !isPaused) {
        e.preventDefault();
        jump();
    }
});

// ควบคุมการกระโดดบนหน้าจอมือถือ
if (touchJumpBtn) {
    touchJumpBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!isGameOver && !isPaused) {
            jump();
        }
    });
}

gameContainer.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT" && !isGameOver && !isPaused) {
        jump();
    }
});

function jump() {
    if (isJumping || isPaused) return;

    if (bgm.paused && !isMuted) {
        bgm.play().catch(() => {});
    }

    isJumping = true;
    jumpSound.currentTime = 0;
    if (!isMuted) jumpSound.play().catch(() => {});
    
    mario.classList.add("jump");
}

mario.addEventListener("animationend", () => {
    mario.classList.remove("jump");
    isJumping = false;
});

function createSingleObstacle() {
    if (isGameOver || isPaused) return;

    const obs = document.createElement("div");
    obs.classList.add("obstacle-dynamic");
    
    const img = document.createElement("img");
    const isFlying = Math.random() < 0.5;

    if (isFlying) {
        img.src = "assets/winged_goomba.png";
        obs.classList.add("obstacle-goomba");
        obs.style.bottom = "210px";
    } else {
        img.src = "assets/a2.png";
        obs.classList.add("obstacle-plant");
        obs.style.bottom = "65px";
    }

    obs.appendChild(img);
    obs.style.right = "-120px";
    gameContainer.appendChild(obs);

    setTimeout(() => {
        if (!isPaused) {
            obs.style.transition = "right 1.8s linear";
            obs.style.right = "1150px";
        }
    }, 20);

    setTimeout(() => {
        if (obs.parentNode) {
            obs.parentNode.removeChild(obs);
        }
    }, 2500);
}

function spawnObstacleWave() {
    if (isGameOver) return;

    if (!isPaused) {
        const count = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < count; i++) {
            const tId = setTimeout(() => {
                if (!isGameOver && !isPaused) {
                    createSingleObstacle();
                }
            }, i * (Math.floor(Math.random() * 250) + 450));
            
            obstacleTimeoutsList.push(tId);
        }
    }

    const nextWaveDelay = Math.floor(Math.random() * 1800) + 2500;
    obstacleTimeout = setTimeout(spawnObstacleWave, nextWaveDelay);
}

function startItemSpawning() {
    itemInterval = setInterval(() => {
        if (isGameOver || isPaused) return;

        item.style.transition = "right 2.4s linear";
        item.style.right = "1150px";

        setTimeout(() => {
            item.style.transition = "none";
            item.style.right = "-80px";
        }, 2400);
    }, 15000);
}

function startTimer() {
    gameTimer = setInterval(() => {
        if (!isPaused && !isGameOver) {
            timeLeft--;
            timerDisplay.innerText = timeLeft;

            if (timeLeft <= 0) {
                endGame("ยินดีด้วย! คุณรอดชีวิตครบ 60 วินาที");
            }
        }
    }, 1000);
}

function startScoring() {
    scoreTimer = setInterval(() => {
        if (!isGameOver && !isPaused) {
            score += 0.05;
            scoreDisplay.innerText = Math.floor(score);
        }
    }, 1);
}

function checkCollision() {
    collisionCheck = setInterval(() => {
        if (isPaused || isGameOver) return;

        const marioRect = mario.getBoundingClientRect();
        const activeObstacles = document.querySelectorAll(".obstacle-dynamic");

        activeObstacles.forEach((obs) => {
            const obsRect = obs.getBoundingClientRect();

            const isColliding = !(
                marioRect.right - 22 < obsRect.left ||
                marioRect.left + 22 > obsRect.right ||
                marioRect.bottom - 18 < obsRect.top ||
                marioRect.top + 18 > obsRect.bottom
            );

            if (isColliding) {
                if (obs.parentNode) {
                    obs.parentNode.removeChild(obs);
                }
                handleHit();
            }
        });
    }, 30);
}

function checkItemCollision() {
    itemCollisionCheck = setInterval(() => {
        if (isGameOver || isPaused) return;

        const marioRect = mario.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        const isColliding = !(
            marioRect.right < itemRect.left ||
            marioRect.left > itemRect.right ||
            marioRect.bottom < itemRect.top ||
            marioRect.top + 15 > itemRect.bottom
        );

        if (isColliding) {
            activateGiantMode();
        }
    }, 30);
}

function activateGiantMode() {
    item.style.transition = "none";
    item.style.right = "-80px";

    collectSound.currentTime = 0;
    if (!isMuted) collectSound.play().catch(() => {});

    isInvincible = true;
    mario.classList.add("giant");

    setTimeout(() => {
        isInvincible = false;
        mario.classList.remove("giant");
    }, 6000);
}

function handleHit() {
    if (isInvincible) {
        score += 250;
        scoreDisplay.innerText = Math.floor(score);
        collectSound.currentTime = 0;
        if (!isMuted) collectSound.play().catch(() => {});
        return;
    }

    hitSound.currentTime = 0;
    if (!isMuted) hitSound.play().catch(() => {});

    lives--;
    livesDisplay.innerText = lives;

    if (lives <= 0) {
        endGame("คุณเสียชีวิตครบ 3 ครั้งแล้ว!");
    }
}

function saveHighScore(pName, pScore) {
    highScores.push({ name: pName, score: Math.floor(pScore) });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem("mario_high_scores_v2", JSON.stringify(highScores));
    updateLeaderboardUI();
}

function updateLeaderboardUI() {
    const listElements = [
        document.getElementById("leaderboard-list"),
        document.getElementById("final-leaderboard-list")
    ];

    listElements.forEach((list) => {
        if (!list) return;
        list.innerHTML = "";
        if (highScores.length === 0) {
            list.innerHTML = "<li>ยังไม่มีข้อมูลคะแนน</li>";
        } else {
            highScores.forEach((item) => {
                const li = document.createElement("li");
                li.innerHTML = `<b>${item.name}</b>: ${item.score} คะแนน`;
                list.appendChild(li);
            });
        }
    });
}

function clearAllObstacleTimeouts() {
    clearTimeout(obstacleTimeout);
    obstacleTimeoutsList.forEach(tId => clearTimeout(tId));
    obstacleTimeoutsList = [];
}

function endGame(statusText) {
    isGameOver = true;
    bgm.pause();

    clearInterval(gameTimer);
    clearInterval(scoreTimer);
    clearInterval(collisionCheck);
    clearInterval(itemCollisionCheck);
    clearInterval(itemInterval);
    
    clearAllObstacleTimeouts();
    document.querySelectorAll(".obstacle-dynamic").forEach(el => el.remove());

    const finalIntegerScore = Math.floor(score);
    saveHighScore(playerName, finalIntegerScore);

    gameStatusTitle.innerText = statusText;
    finalPlayerName.innerText = playerName;
    finalScoreDisplay.innerText = finalIntegerScore;
    gameOverScreen.classList.remove("hidden");
}

function restartGameFromSettings() {
    settingsModal.classList.add("hidden");
    restartGame();
}

function restartGame() {
    clearInterval(gameTimer);
    clearInterval(scoreTimer);
    clearInterval(collisionCheck);
    clearInterval(itemCollisionCheck);
    clearInterval(itemInterval);
    
    clearAllObstacleTimeouts();
    document.querySelectorAll(".obstacle-dynamic").forEach(el => el.remove());

    score = 0;
    timeLeft = 60;
    lives = 3;
    isGameOver = false;
    isPaused = false;

    mario.classList.remove("paused");
    mario.classList.remove("giant");

    currentPlayerDisplay.innerText = playerName;
    scoreDisplay.innerText = 0;
    timerDisplay.innerText = timeLeft;
    livesDisplay.innerText = lives;

    item.style.transition = "none";
    item.style.right = "-80px";

    gameOverScreen.classList.add("hidden");

    bgm.currentTime = 0;
    if (!isMuted) bgm.play().catch(() => {});

    spawnObstacleWave();
    startItemSpawning();
    startTimer();
    startScoring();
    checkCollision();
    checkItemCollision();
}