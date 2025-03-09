// Obtener el canvas y el contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Obtener los elementos de audio
const backgroundMusic = document.getElementById("backgroundMusic");
const crashSound = document.getElementById("crashSound");

// Obtener el botón de salto
const jumpButton = document.getElementById("jumpButton");

// Forzar interacción inicial para desbloquear audio en navegadores
document.addEventListener("DOMContentLoaded", () => {
    canvas.addEventListener("click", unlockAudio, { once: true });
    canvas.addEventListener("touchstart", unlockAudio, { once: true });
});

function unlockAudio() {
    backgroundMusic.play().then(() => {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        console.log("Audio desbloqueado con éxito");
    }).catch(error => {
        console.error("Error al desbloquear audio:", error);
    });
}

// Propiedades del dinosaurio
let dino = {
    x: 50,
    y: 340 - 70,
    width: 70,
    height: 70,
    dy: 0,
    gravity: 0.5,
    jumpPower: -12,
    grounded: true,
    jumps: 0,
    maxJumps: 3
};

// Array para almacenar obstáculos y nubes
let obstacles = [];
let clouds = [
    { x: 600, y: 50, speed: 1, parts: [{w: 40, h: 20}, {w: 30, h: 15, offsetX: 20, offsetY: -10}, {w: 20, h: 10, offsetX: 10, offsetY: 10}] },
    { x: 800, y: 80, speed: 0.5, parts: [{w: 50, h: 25}, {w: 30, h: 20, offsetX: 30, offsetY: -15}, {w: 20, h: 15, offsetX: 20, offsetY: 10}] }
];
let score = 0;
let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;
let gameOver = false;
let gameStarted = false;
let isSpacePressed = false; // Nueva variable para rastrear la barra espaciadora
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const resetSlidersButton = document.getElementById("resetSliders");

// Elementos de los sliders
const gravitySlider = document.getElementById("gravitySlider");
const frequencySlider = document.getElementById("frequencySlider");
const treeSizeSlider = document.getElementById("treeSizeSlider");

// Valores por defecto de los sliders
const defaultGravity = 2;
const defaultFrequency = 300;
const defaultTreeSize = 1;

// Variables para sliders
let minObstacleFrequency = parseInt(frequencySlider.value);
let treeSizeMultiplier = parseFloat(treeSizeSlider.value);

// Crear spans para mostrar los valores dinámicamente
const gravityValue = document.createElement("span");
gravityValue.className = "slider-value";
gravitySlider.parentNode.appendChild(gravityValue);

const frequencyValue = document.createElement("span");
frequencyValue.className = "slider-value";
frequencySlider.parentNode.appendChild(frequencyValue);

const treeSizeValue = document.createElement("span");
treeSizeValue.className = "slider-value";
treeSizeSlider.parentNode.appendChild(treeSizeValue);

// Función para actualizar el valor y su posición
function updateSliderValue(slider, valueElement, unit) {
    const value = parseFloat(slider.value);
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const percentage = (value - min) / (max - min);
    const displayValue = unit === "g" ? (value * 0.5).toFixed(1) : unit === "s" ? (value / 1000).toFixed(1) : value;
    valueElement.textContent = `${displayValue}${unit === "g" ? "g" : unit}`;

    const controlRow = slider.parentNode;
    const sliderRect = slider.getBoundingClientRect();
    const controlRowRect = controlRow.getBoundingClientRect();
    const sliderOffsetLeft = sliderRect.left - controlRowRect.left;
    const sliderWidth = slider.offsetWidth;
    const thumbWidth = 40;
    const thumbPosition = percentage * (sliderWidth - thumbWidth) + (thumbWidth / 2);
    const absolutePosition = sliderOffsetLeft + thumbPosition;
    valueElement.style.left = `${absolutePosition}px`;
}

// Función para reiniciar sliders a valores por defecto
function resetSliders() {
    gravitySlider.value = defaultGravity;
    frequencySlider.value = defaultFrequency;
    treeSizeSlider.value = defaultTreeSize;

    dino.gravity = parseFloat(gravitySlider.value) * 0.25;
    minObstacleFrequency = parseInt(frequencySlider.value);
    treeSizeMultiplier = parseFloat(treeSizeSlider.value);

    updateSliderValue(gravitySlider, gravityValue, "g");
    updateSliderValue(frequencySlider, frequencyValue, "s");
    updateSliderValue(treeSizeSlider, treeSizeValue, "x");
}

// Asegurar que los valores iniciales se establezcan después de cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    updateSliderValue(gravitySlider, gravityValue, "g");
    updateSliderValue(frequencySlider, frequencyValue, "s");
    updateSliderValue(treeSizeSlider, treeSizeValue, "x");

    gravitySlider.addEventListener("input", () => {
        dino.gravity = parseFloat(gravitySlider.value) * 0.25;
        updateSliderValue(gravitySlider, gravityValue, "g");
    });

    frequencySlider.addEventListener("input", () => {
        minObstacleFrequency = parseInt(frequencySlider.value);
        updateSliderValue(frequencySlider, frequencyValue, "s");
    });

    treeSizeSlider.addEventListener("input", () => {
        treeSizeMultiplier = parseFloat(treeSizeSlider.value);
        updateSliderValue(treeSizeSlider, treeSizeValue, "x");
    });

    startButton.addEventListener("click", startGame);
    resetSlidersButton.addEventListener("click", resetSliders);

    jumpButton.addEventListener("touchstart", (event) => {
        event.preventDefault();
        if (gameStarted && !gameOver) {
            handleJump();
            jumpButton.blur(); // Quitar el foco del botón
        }
    });

    jumpButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (gameStarted && !gameOver) {
            handleJump();
            jumpButton.blur(); // Quitar el foco del botón
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.code === "Space" && !isSpacePressed) {
            if (!gameStarted && !gameOver) {
                startGame();
            } else if (gameStarted && !gameOver) {
                handleJump();
            }
            isSpacePressed = true;
        }
    });

    document.addEventListener("keyup", function(event) {
        if (event.code === "Space") {
            isSpacePressed = false;
        }
    });

    canvas.addEventListener("touchstart", function(event) {
        event.preventDefault();
        if (!gameStarted && !gameOver) {
            startGame();
        } else if (gameStarted && !gameOver) {
            handleJump();
        }
    });
});

// Función separada para manejar el salto
function handleJump() {
    if (dino.jumps < dino.maxJumps) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
        dino.jumps++;
        console.log("Saltos actuales:", dino.jumps);
        if (backgroundMusic.paused) {
            backgroundMusic.play().then(() => {
                console.log("Música de fondo reproducida");
            }).catch(error => {
                console.error("Error al reproducir música:", error);
            });
        }
    }
}

// Generar obstáculos aleatorios
let nextObstacleTime = 0;

function spawnObstacles(timestamp) {
    if (timestamp >= nextObstacleTime) {
        createObstacle();
        nextObstacleTime = timestamp + (Math.random() * 2000) + minObstacleFrequency;
    }
}

// Propiedades de un obstáculo (arbolito)
function createObstacle() {
    let baseTrunkHeight = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
    let baseCanopySize = Math.floor(Math.random() * (30 - 20 + 1)) + 20;
    let obstacle = {
        x: canvas.width,
        y: 340 - (baseTrunkHeight * treeSizeMultiplier) - (baseCanopySize * treeSizeMultiplier),
        trunkWidth: 10 * treeSizeMultiplier,
        trunkHeight: baseTrunkHeight * treeSizeMultiplier,
        canopySize: baseCanopySize * treeSizeMultiplier,
        speed: 3
    };
    obstacles.push(obstacle);
}

// Dibujar el dinosaurio (T-Rex inclinado)
function drawDino() {
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.fillRect(dino.x + 20, dino.y + 40, 30, 10);
    ctx.fillRect(dino.x + 25, dino.y + 30, 30, 10);
    ctx.fillRect(dino.x + 30, dino.y + 20, 30, 10);
    ctx.fillRect(dino.x + 40, dino.y, 30, 20);
    ctx.fillRect(dino.x + 10, dino.y + 40, 10, 10);
    ctx.fillRect(dino.x, dino.y + 50, 10, 10);
    ctx.fillRect(dino.x - 10, dino.y + 60, 10, 10);
    let legHeight = dino.grounded ? 20 : 25;
    ctx.fillRect(dino.x + 20, dino.y + 50, 10, legHeight);
    ctx.fillRect(dino.x + 35, dino.y + 50, 10, legHeight);
    ctx.fillRect(dino.x + 50, dino.y + 25, 10, 5);
    ctx.fillRect(dino.x + 50, dino.y + 35, 10, 5);
    ctx.fillStyle = "white";
    ctx.fillRect(dino.x + 50, dino.y + 5, 5, 5);
    ctx.fillStyle = "black";
    ctx.fillRect(dino.x + 52, dino.y + 7, 2, 2);
}

// Actualizar la posición del dinosaurio
function updateDino() {
    if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
    }
    if (dino.y >= 340 - dino.height) {
        dino.y = 340 - dino.height;
        dino.dy = 0;
        dino.grounded = true;
        dino.jumps = 0;
        console.log("Tocado el suelo, saltos reiniciados a:", dino.jumps);
    }
}

// Dibujar los obstáculos (arbolitos)
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = "brown";
        ctx.fillRect(
            obstacle.x,
            obstacle.y + obstacle.canopySize,
            obstacle.trunkWidth,
            obstacle.trunkHeight
        );
        ctx.fillStyle = "rgba(0, 128, 0, 0.7)";
        let canopyRadius = obstacle.canopySize / 2;
        ctx.fillRect(
            obstacle.x - canopyRadius + 5,
            obstacle.y,
            obstacle.canopySize,
            obstacle.canopySize
        );
        ctx.fillRect(
            obstacle.x - canopyRadius + 10,
            obstacle.y - 5,
            obstacle.canopySize - 10,
            obstacle.canopySize + 10
        );
    });
}

// Actualizar los obstáculos
function updateObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
    });
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.trunkWidth > 0);
}

// Dibujar y mover nubes
function drawClouds() {
    clouds.forEach(cloud => {
        ctx.fillStyle = "rgba(180, 180, 180, 0.9)";
        cloud.parts.forEach(part => {
            ctx.fillRect(
                cloud.x + (part.offsetX || 0),
                cloud.y + (part.offsetY || 0),
                part.w,
                part.h
            );
        });
    });
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + 60 < 0) {
            cloud.x = canvas.width;
        }
    });
}

// Detectar colisiones
function checkCollision() {
    for (let obstacle of obstacles) {
        let canopyLeft = obstacle.x - obstacle.canopySize / 2 + 5;
        let canopyRight = canopyLeft + obstacle.canopySize;
        let trunkLeft = obstacle.x;
        let trunkRight = obstacle.x + obstacle.trunkWidth;

        if (
            dino.x + 50 > canopyLeft &&
            dino.x + 20 < canopyRight &&
            dino.y + dino.height > obstacle.y &&
            dino.y < obstacle.y + obstacle.canopySize
        ) {
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("highScore", highScore);
            }
            restartButton.style.display = "block";
            jumpButton.style.display = "none";
            gameOver = true;
            backgroundMusic.pause();
            crashSound.play().then(() => {
                console.log("Sonido de choque reproducido");
            }).catch(error => {
                console.error("Error al reproducir sonido de choque:", error);
            });
            return true;
        }
        if (
            dino.x + 50 > trunkLeft &&
            dino.x + 20 < trunkRight &&
            dino.y + dino.height > obstacle.y + obstacle.canopySize
        ) {
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("highScore", highScore);
            }
            restartButton.style.display = "block";
            jumpButton.style.display = "none";
            gameOver = true;
            backgroundMusic.pause();
            crashSound.play().then(() => {
                console.log("Sonido de choque reproducido");
            }).catch(error => {
                console.error("Error al reproducir sonido de choque:", error);
            });
            return true;
        }
    }
    return false;
}

// Dibujar el puntaje (en la derecha)
function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Puntaje: " + score, canvas.width - 10, 30);
    ctx.fillText("Mejor: " + highScore, canvas.width - 10, 60);
}

// Dibujar el suelo
function drawGround() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.lineTo(canvas.width, 340);
    ctx.stroke();
}

// Iniciar el juego
function startGame() {
    startButton.style.display = "none";
    jumpButton.style.display = "block";
    gameStarted = true;
    backgroundMusic.play().then(() => {
        console.log("Música de fondo reproducida al iniciar");
    }).catch(error => {
        console.error("Error al reproducir música al iniciar:", error);
    });
    gameLoop();
}

// Reiniciar el juego
function restartGame() {
    dino.y = 340 - dino.height;
    dino.dy = 0;
    dino.grounded = true;
    dino.jumps = 0;
    obstacles = [];
    score = 0;
    gameOver = false;
    nextObstacleTime = 0;
    restartButton.style.display = "none";
    jumpButton.style.display = "block";
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().then(() => {
        console.log("Música de fondo reproducida al reiniciar");
    }).catch(error => {
        console.error("Error al reproducir música al reiniciar:", error);
    });
    gameLoop();
}

// Botón de reinicio
restartButton.addEventListener("click", restartGame);

// Bucle principal del juego
function gameLoop(timestamp = 0) {
    if (gameOver || !gameStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateDino();
    drawDino();
    updateObstacles();
    drawObstacles();
    spawnObstacles(timestamp);
    updateClouds();
    drawClouds();
    score++;
    drawScore();
    drawGround();
    if (!checkCollision()) {
        requestAnimationFrame(gameLoop);
    }
}