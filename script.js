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
    jumpPower: -4,
    grounded: true,
    jumps: 0,
    maxJumps: 2
};

// Array para almacenar obstáculos y nubes
let obstacles = [];
let clouds = [
    { x: 600, y: 50, width: 60, height: 20, speed: 1 },
    { x: 800, y: 80, width: 80, height: 25, speed: 0.5 }
];
let score = 0;
let gameOver = false;
const restartButton = document.getElementById("restartButton");

// Propiedades de un obstáculo
function createObstacle() {
    let height = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
    let obstacle = {
        x: canvas.width,
        y: 340 - height,
        width: 20,
        height: height,
        speed: 3
    };
    obstacles.push(obstacle);
}

// Dibujar el dinosaurio (T-Rex inclinado)
function drawDino() {
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.fillRect(dino.x + 20, dino.y + 20, 30, 10); // Base del cuerpo
    ctx.fillRect(dino.x + 25, dino.y + 10, 30, 10); // Medio
    ctx.fillRect(dino.x + 30, dino.y, 30, 10); // Superior
    ctx.fillRect(dino.x + 40, dino.y - 20, 30, 20); // Cabeza
    ctx.fillRect(dino.x + 10, dino.y + 20, 10, 10); // Cola base
    ctx.fillRect(dino.x, dino.y + 30, 10, 10); // Cola medio
    ctx.fillRect(dino.x - 10, dino.y + 40, 10, 10); // Cola punta
    ctx.fillRect(dino.x + 20, dino.y + 35, 10, 25); // Pierna trasera
    ctx.fillRect(dino.x + 35, dino.y + 40, 10, 25); // Pierna delantera
    ctx.fillRect(dino.x + 50, dino.y + 5, 10, 5); // Brazo superior
    ctx.fillRect(dino.x + 50, dino.y + 15, 10, 5); // Brazo inferior
    ctx.fillStyle = "white";
    ctx.fillRect(dino.x + 50, dino.y - 15, 5, 5); // Ojo
    ctx.fillStyle = "black";
    ctx.fillRect(dino.x + 52, dino.y - 13, 2, 2); // Pupila
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

// Dibujar los obstáculos
function drawObstacles() {
    ctx.fillStyle = "brown";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Actualizar los obstáculos
function updateObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
    });
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
}

// Generar obstáculos aleatorios
let lastObstacleTime = 0;
function spawnObstacles(timestamp) {
    if (timestamp - lastObstacleTime > Math.random() * 2000 + 1000) {
        createObstacle();
        lastObstacleTime = timestamp;
    }
}

// Dibujar y mover nubes
function drawClouds() {
    ctx.fillStyle = "gray";
    clouds.forEach(cloud => {
        ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
    });
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
    });
}

// Detectar colisiones
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            dino.x + 50 > obstacle.x &&
            dino.x + 20 < obstacle.x + obstacle.width &&
            dino.y + dino.height > obstacle.y
        ) {
            restartButton.style.display = "block";
            gameOver = true;
            return true;
        }
    }
    return false;
}

// Dibujar el puntaje
function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Puntaje: " + score, 10, 30);
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
