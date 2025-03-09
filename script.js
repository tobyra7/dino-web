// Función para formatear números con separador de miles
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Obtener el canvas y el contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Obtener los elementos de audio
const backgroundMusic = document.getElementById("backgroundMusic");
const crashSound = document.getElementById("crashSound");
const jump1Sound = document.getElementById("jump1Sound");
const jump2Sound = document.getElementById("jump2Sound");
const jump3Sound = document.getElementById("jump3Sound");

// Obtener el botón de salto
const jumpButton = document.getElementById("jumpButton");

// Variable para rastrear si el audio está desbloqueado
let audioUnlocked = false;

// Variables para controlar los estados de los sonidos
let musicEnabled = true;
let effectsEnabled = true;

// Obtener los nuevos interruptores
const musicToggle = document.getElementById("musicToggle");
const effectsToggle = document.getElementById("effectsToggle");

// Función para desbloquear el audio
function unlockAudio() {
    if (!audioUnlocked) {
        const audios = [backgroundMusic, crashSound, jump1Sound, jump2Sound, jump3Sound];
        const promises = audios.map(audio => {
            return audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                console.log(`Audio ${audio.id} desbloqueado con éxito`);
                return true;
            }).catch(error => {
                console.error(`Error al desbloquear audio ${audio.id}:`, error);
                return false;
            });
        });

        Promise.all(promises).then(results => {
            if (results.every(result => result)) {
                audioUnlocked = true;
                console.log("Todos los audios desbloqueados correctamente");
                // Reproducir música si está habilitada
                if (gameStarted && musicEnabled) {
                    backgroundMusic.play().catch(error => {
                        console.error("Error al reproducir música después de desbloquear:", error);
                    });
                }
            } else {
                console.log("No se pudieron desbloquear todos los audios");
            }
        });
    }
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
    maxJumps: 3,
    rotation: 0, // Ángulo de rotación en radianes
    lastJumpTime: 0 // Tiempo del último salto para calcular el giro
};

// Array para almacenar obstáculos y nubes
let obstacles = [];
let clouds = [
    { x: 600, y: 50, speed: 1, parts: [{w: 40, h: 20}, {w: 30, h: 15, offsetX: 20, offsetY: -10}, {w: 20, h: 10, offsetX: 10, offsetY: 10}] },
    { x: 800, y: 80, speed: 0.5, parts: [{w: 50, h: 25}, {w: 30, h: 20, offsetX: 30, offsetY: -15}, {w: 20, h: 15, offsetX: 20, offsetY: 10}] }
];
let score = 0;
let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;
console.log("HighScore inicial:", highScore);
let gameOver = false;
let gameStarted = false;
let isSpacePressed = false;
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

    // Controlar la música
    musicToggle.addEventListener("change", (e) => {
        musicEnabled = musicToggle.checked;
        if (!musicEnabled) {
            backgroundMusic.pause();
        } else if (audioUnlocked && gameStarted) {
            backgroundMusic.play().catch(error => {
                console.error("Error al reproducir música al activar:", error);
            });
        }
        console.log("Música habilitada:", musicEnabled);
        e.stopPropagation(); // Evita que el evento se propague a otros elementos
        musicToggle.blur(); // Quitar el focus del interruptor
    });

    // Controlar los efectos
    effectsToggle.addEventListener("change", (e) => {
        effectsEnabled = effectsToggle.checked;
        console.log("Efectos habilitados:", effectsEnabled);
        e.stopPropagation(); // Evita que el evento se propague a otros elementos
        effectsToggle.blur(); // Quitar el focus del interruptor
    });

    startButton.addEventListener("click", () => {
        unlockAudio(); // Desbloquear el audio al hacer clic en "Jugar"
        startGame();
    });
    resetSlidersButton.addEventListener("click", resetSliders);

    jumpButton.addEventListener("touchstart", (event) => {
        event.preventDefault();
        console.log("Toque en botón Saltar detectado");
        if (gameStarted && !gameOver) {
            handleJump();
            jumpButton.blur();
        }
    });

    jumpButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (gameStarted && !gameOver) {
            handleJump();
            jumpButton.blur();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.code === "Space" && !isSpacePressed) {
            if (!gameStarted && !gameOver) {
                unlockAudio(); // Desbloquear el audio al presionar espacio para iniciar
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
            unlockAudio(); // Desbloquear el audio al tocar el canvas para iniciar
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

        // Reproducir el sonido solo si los efectos están habilitados
        let jumpSound;
        if (dino.jumps === 1) {
            jumpSound = jump1Sound;
        } else if (dino.jumps === 2) {
            jumpSound = jump2Sound;
        } else if (dino.jumps === 3) {
            jumpSound = jump3Sound;
        }

        if (jumpSound && audioUnlocked && effectsEnabled) {
            jumpSound.currentTime = 0; // Reiniciar el sonido
            jumpSound.play().catch(error => {
                console.error(`Error al reproducir sonido de salto ${dino.jumps}:`, error);
            });
        }

        // Reproducir música si está habilitada y pausada
        if (backgroundMusic.paused && audioUnlocked && musicEnabled) {
            backgroundMusic.play().catch(error => {
                console.error("Error al reproducir música:", error);
            });
        }

        if (dino.jumps > 1) { // Iniciar el tiempo del salto solo para el segundo y tercer salto
            dino.lastJumpTime = performance.now();
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

// Dibujar el dinosaurio (T-Rex inclinado con frontflip)
function drawDino() {
    ctx.save(); // Guardar el estado actual del canvas

    // Calcular la rotación solo para el segundo y tercer salto
    if (!dino.grounded && (dino.jumps === 2 || dino.jumps === 3) && dino.lastJumpTime > 0) {
        const currentTime = performance.now();
        const timeSinceJump = (currentTime - dino.lastJumpTime) / 400; // Ajustar 400 para controlar la velocidad del giro
        dino.rotation = (timeSinceJump * 2 * Math.PI) % (2 * Math.PI); // Limitar a un solo giro de 360°
        if (timeSinceJump > 1) dino.rotation = 2 * Math.PI; // Completar el giro después de 1 segundo
    } else {
        dino.rotation = 0; // Sin rotación en el primer salto o en el suelo
    }

    // Trasladar el origen al centro del dinosaurio para la rotación
    ctx.translate(dino.x + dino.width / 2, dino.y + dino.height / 2);
    ctx.rotate(dino.rotation);
    ctx.translate(-dino.x - dino.width / 2, -dino.y - dino.height / 2);

    // Dibujar el dinosaurio
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

    ctx.restore(); // Restaurar el estado del canvas

    // Resetear lastJumpTime cuando toca el suelo
    if (dino.grounded) {
        dino.lastJumpTime = 0;
    }
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
                console.log("Nuevo HighScore guardado:", highScore);
            }
            restartButton.style.display = "block";
            jumpButton.style.display = "none";
            gameOver = true;
            if (audioUnlocked && effectsEnabled) {
                backgroundMusic.pause();
                crashSound.currentTime = 0;
                crashSound.play().then(() => {
                    console.log("Sonido de choque reproducido");
                }).catch(error => {
                    console.error("Error al reproducir sonido de choque:", error);
                });
            }
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
                console.log("Nuevo HighScore guardado:", highScore);
            }
            restartButton.style.display = "block";
            jumpButton.style.display = "none";
            gameOver = true;
            if (audioUnlocked && effectsEnabled) {
                backgroundMusic.pause();
                crashSound.currentTime = 0;
                crashSound.play().then(() => {
                    console.log("Sonido de choque reproducido");
                }).catch(error => {
                    console.error("Error al reproducir sonido de choque:", error);
                });
            }
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
    ctx.fillText("Score: " + formatNumber(score), canvas.width - 10, 30);
    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width - 100, 40, 90, 25);
    ctx.fillStyle = "black";
    ctx.fillText("HighScore: " + formatNumber(highScore), canvas.width - 10, 60);
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
    if (audioUnlocked && musicEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(error => {
            console.error("Error al reproducir música al iniciar:", error);
        });
    }
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
    if (audioUnlocked && musicEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(error => {
            console.error("Error al reproducir música al reiniciar:", error);
        });
    }
    gameLoop();
}

// Botón de reinicio
restartButton.addEventListener("click", () => {
    unlockAudio(); // Desbloquear el audio al reiniciar
    restartGame();
});

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