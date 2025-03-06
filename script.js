// Obtener el canvas y el contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Obtener los elementos de audio
const backgroundMusic = document.getElementById("backgroundMusic");
const crashSound = document.getElementById("crashSound");

// Propiedades del dinosaurio
let dino = {
    x: 50,
    y: 340 - 70,
    width: 70,
    height: 70,
    dy: 0,
    gravity: 0.5, // Valor por defecto restaurado a 0.5g
    jumpPower: -12, // Valor original del salto
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
let gameOver = false;
let gameStarted = false;
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const resetSlidersButton = document.getElementById("resetSliders");

// Elementos de los sliders
const gravitySlider = document.getElementById("gravitySlider");
const frequencySlider = document.getElementById("frequencySlider");
const treeSizeSlider = document.getElementById("treeSizeSlider");

// Valores por defecto de los sliders
const defaultGravity = 1; // Valor del slider que da 0.5g (1 * 0.5)
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
    const displayValue = unit === "g" ? (value * 0.5).toFixed(1) : unit === "s" ? (value / 1000).toFixed(1) : value; // Ajuste para gravedad
    valueElement.textContent = `${displayValue}${unit === "g" ? "g" : unit}`;

    // Obtener el contenedor .control-row padre
    const controlRow = slider.parentNode;
    const sliderRect = slider.getBoundingClientRect();
    const controlRowRect = controlRow.getBoundingClientRect();

    // Calcular el offset del slider respecto al contenedor .control-row
    const sliderOffsetLeft = sliderRect.left - controlRowRect.left;

    // Calcular la posición del thumb como porcentaje del ancho del slider
    const sliderWidth = slider.offsetWidth;
    const thumbWidth = 40; // Ancho del thumb en CSS
    const thumbPosition = percentage * (sliderWidth - thumbWidth) + (thumbWidth / 2);

    // Posición absoluta del label respecto al contenedor, centrada sobre el thumb
    const absolutePosition = sliderOffsetLeft + thumbPosition;
    valueElement.style.left = `${absolutePosition}px`; // Posición absoluta dentro de .control-row
}

// Función para reiniciar sliders a valores por defecto
function resetSliders() {
    gravitySlider.value = defaultGravity;
    frequencySlider.value = defaultFrequency;
    treeSizeSlider.value = defaultTreeSize;

    dino.gravity = parseFloat(gravitySlider.value) * 0.5; // Restaurar factor de 0.5
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
        dino.gravity = parseFloat(gravitySlider.value) * 0.5;
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

    // Permitir iniciar y saltar con barra espaciadora
    document.addEventListener("keydown", function(event) {
        if (event.code === "Space" && !gameStarted && !gameOver) {
            startGame();
        } else if (event.code === "Space" && gameStarted && !gameOver) {
            handleJump();
        }
    });

    // Permitir iniciar y saltar con toque en el canvas
    canvas.addEventListener("touchstart", function(event) {
        if (!gameStarted && !gameOver) {
            event.preventDefault();
            startGame();
        } else if (gameStarted && !gameOver) {
            event.preventDefault();
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
            backgroundMusic.play().catch(error => console.log("Error al reproducir música con salto:", error));
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
        dino.dy += dino.gravity; // Restaurar sin factor adicional
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
            restartButton.style.display = "block";
            gameOver = true;
            backgroundMusic.pause();
            crashSound.play().catch(error => console.log("Error al reproducir choque:", error));
            return true;
        }
        if (
            dino.x + 50 > trunkLeft &&
            dino.x + 20 < trunkRight &&
            dino.y + dino.height > obstacle.y + obstacle.canopySize
        ) {
            restartButton.style.display = "block";
            gameOver = true;
            backgroundMusic.pause();
            crashSound.play().catch(error => console.log("Error al reproducir choque:", error));
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
    gameStarted = true;
    backgroundMusic.play().catch(error => console.log("Error al reproducir música al iniciar:", error));
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
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(error => console.log("Error al reproducir música al reiniciar:", error));
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