// Obtener el canvas y el contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
let gameOver = false;
const restartButton = document.getElementById("restartButton");

// Elementos de los sliders
const gravitySlider = document.getElementById("gravitySlider");
const frequencySlider = document.getElementById("frequencySlider");
const treeSizeSlider = document.getElementById("treeSizeSlider");

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
    const displayValue = unit === "s" ? (value / 1000).toFixed(1) : value;
    valueElement.textContent = `${displayValue}${unit}`;

    // Obtener la posición absoluta del slider en la página
    const sliderRect = slider.getBoundingClientRect();
    const sliderLeft = sliderRect.left; // Coordenada izquierda del slider
    const sliderWidth = slider.offsetWidth;
    const thumbWidth = 40; // Ancho del thumb

    // Calcular la posición del thumb respecto al inicio del slider
    const thumbPosition = percentage * (sliderWidth - thumbWidth) + (thumbWidth / 2);
    // Ajustar la posición del span respecto al contenedor padre (.control-row)
    const containerRect = slider.parentNode.getBoundingClientRect();
    const offsetLeft = sliderLeft - containerRect.left; // Offset del slider respecto al contenedor
    const centeredPosition = offsetLeft + thumbPosition - (valueElement.offsetWidth / 2) + 18; // Ajuste de +18px
    valueElement.style.left = `${centeredPosition}px`;
}

// Asegurar que los valores iniciales se establezcan después de cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    updateSliderValue(gravitySlider, gravityValue, "g");
    updateSliderValue(frequencySlider, frequencyValue, "s");
    updateSliderValue(treeSizeSlider, treeSizeValue, "x");

    // Actualizar valores desde sliders
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
});

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
            return true;
        }
        if (
            dino.x + 50 > trunkLeft &&
            dino.x + 20 < trunkRight &&
            dino.y + dino.height > obstacle.y + obstacle.canopySize
        ) {
            restartButton.style.display = "block";
            gameOver = true;
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

// Escuchar la tecla para saltar
document.addEventListener("keydown", function(event) {
    if (event.code === "Space" && dino.jumps < dino.maxJumps) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
        dino.jumps++;
    }
});

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
    gameLoop();
}

// Botón de reinicio
restartButton.addEventListener("click", restartGame);

// Bucle principal del juego
function gameLoop(timestamp = 0) {
    if (gameOver) return;
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

// Iniciar el juego
gameLoop();