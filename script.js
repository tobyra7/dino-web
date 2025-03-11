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
    rotation: 0,
    lastJumpTime: 0
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
        e.stopPropagation();
        musicToggle.blur();
    });

    effectsToggle.addEventListener("change", (e) => {
        effectsEnabled = effectsToggle.checked;
        console.log("Efectos habilitados:", effectsEnabled);
        e.stopPropagation();
        effectsToggle.blur();
    });

    startButton.addEventListener("click", () => {
        unlockAudio();
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
                unlockAudio();
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
            unlockAudio();
            startGame();
        } else if (gameStarted && !gameOver) {
            handleJump();
        }
    });

    const topScoresButton = document.getElementById("topScoresButton");
    topScoresButton.addEventListener("click", () => {
        console.log("Botón Top Scores clicado");
        showLeaderboard();
    });
});

// Función separada para manejar el salto
function handleJump() {
    if (dino.jumps < dino.maxJumps) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
        dino.jumps++;
        console.log("Saltos actuales:", dino.jumps);

        let jumpSound;
        if (dino.jumps === 1) jumpSound = jump1Sound;
        else if (dino.jumps === 2) jumpSound = jump2Sound;
        else if (dino.jumps === 3) jumpSound = jump3Sound;

        if (jumpSound && audioUnlocked && effectsEnabled) {
            jumpSound.currentTime = 0;
            jumpSound.play().catch(error => {
                console.error(`Error al reproducir sonido de salto ${dino.jumps}:`, error);
            });
        }

        if (backgroundMusic.paused && audioUnlocked && musicEnabled) {
            backgroundMusic.play().catch(error => {
                console.error("Error al reproducir música:", error);
            });
        }

        if (dino.jumps > 1) {
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

function drawDino() {
    ctx.save();
    if (!dino.grounded && (dino.jumps === 2 || dino.jumps === 3) && dino.lastJumpTime > 0) {
        const currentTime = performance.now();
        const timeSinceJump = (currentTime - dino.lastJumpTime) / 400;
        dino.rotation = (timeSinceJump * 2 * Math.PI) % (2 * Math.PI);
        if (timeSinceJump > 1) dino.rotation = 2 * Math.PI;
    } else {
        dino.rotation = 0;
    }

    ctx.translate(dino.x + dino.width / 2, dino.y + dino.height / 2);
    ctx.rotate(dino.rotation);
    ctx.translate(-dino.x - dino.width / 2, -dino.y - dino.height / 2);

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

    ctx.restore();
    if (dino.grounded) dino.lastJumpTime = 0;
}

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

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = "brown";
        ctx.fillRect(obstacle.x, obstacle.y + obstacle.canopySize, obstacle.trunkWidth, obstacle.trunkHeight);
        ctx.fillStyle = "rgba(0, 128, 0, 0.7)";
        let canopyRadius = obstacle.canopySize / 2;
        ctx.fillRect(obstacle.x - canopyRadius + 5, obstacle.y, obstacle.canopySize, obstacle.canopySize);
        ctx.fillRect(obstacle.x - canopyRadius + 10, obstacle.y - 5, obstacle.canopySize - 10, obstacle.canopySize + 10);
    });
}

function updateObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
    });
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.trunkWidth > 0);
}

function drawClouds() {
    clouds.forEach(cloud => {
        ctx.fillStyle = "rgba(180, 180, 180, 0.9)";
        cloud.parts.forEach(part => {
            ctx.fillRect(cloud.x + (part.offsetX || 0), cloud.y + (part.offsetY || 0), part.w, part.h);
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
            gameOver = true;
            if (audioUnlocked && effectsEnabled) {
                backgroundMusic.pause();
                crashSound.currentTime = 0;
                crashSound.play().catch(error => {
                    console.error("Error al reproducir sonido de choque:", error);
                });
            }
            checkAndShowNameInput(score);
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
            gameOver = true;
            if (audioUnlocked && effectsEnabled) {
                backgroundMusic.pause();
                crashSound.currentTime = 0;
                crashSound.play().catch(error => {
                    console.error("Error al reproducir sonido de choque:", error);
                });
            }
            checkAndShowNameInput(score);
            return true;
        }
    }
    return false;
}

function drawScore() {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(canvas.width - 120, 10, 110, 50);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 120, 10, 110, 50);

    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText("Score: " + formatNumber(score), canvas.width - 10, 30);
    ctx.fillText("HighScore: " + formatNumber(highScore), canvas.width - 10, 50);
}

function drawGround() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.lineTo(canvas.width, 340);
    ctx.stroke();
}

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

// Funciones de APIs
function checkAndShowNameInput(score) {
    fetch('https://dino-leaderboard-api.onrender.com/api/submit-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: score }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.inTop5) {
            showNameInputForm(score);
        } else {
            restartButton.style.display = "block";
            jumpButton.style.display = "none";
        }
    })
    .catch(error => {
        console.error('Error al enviar puntaje:', error);
        restartButton.style.display = "block";
        jumpButton.style.display = "none";
    });
}

function showNameInputForm(score) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);

    ctx.fillStyle = 'green';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡Estás en el TOP 5!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText('Ingresa tu nombre:', canvas.width / 2, canvas.height / 2);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tu nombre';
    input.style.position = 'absolute';
    input.style.left = `${canvas.offsetLeft + canvas.width / 2 - 100}px`;
    input.style.top = `${canvas.offsetTop + canvas.height / 2 + 20}px`;
    input.style.width = '200px';
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.border = '2px solid green';
    input.style.borderRadius = '5px';
    input.style.backgroundColor = '#e0f7e0';
    input.style.color = 'black';
    input.style.outline = 'none';
    document.body.appendChild(input);

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Guardar';
    submitButton.style.position = 'absolute';
    submitButton.style.left = `${canvas.offsetLeft + canvas.width / 2 - 100}px`;
    submitButton.style.top = `${canvas.offsetTop + canvas.height / 2 + 60}px`;
    submitButton.style.width = '220px';
    submitButton.style.padding = '10px';
    submitButton.style.fontSize = '16px';
    submitButton.style.backgroundColor = '#4CAF50';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
    submitButton.style.transition = 'background-color 0.3s';
    submitButton.addEventListener('mouseover', () => {
        submitButton.style.backgroundColor = '#45a049';
    });
    submitButton.addEventListener('mouseout', () => {
        submitButton.style.backgroundColor = '#4CAF50';
    });
    document.body.appendChild(submitButton);

    submitButton.addEventListener('click', () => {
        const name = input.value.trim();
        if (name) {
            fetch('https://dino-leaderboard-api.onrender.com/api/save-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score: score, name: name }),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                input.remove();
                submitButton.remove();
                showLeaderboard();
            })
            .catch(error => {
                console.error('Error al guardar puntaje:', error);
                input.remove();
                submitButton.remove();
                showLeaderboard();
            });
        }
    });
}

function showLeaderboard() {
    console.log("Intentando mostrar el leaderboard...");
    fetch('https://dino-leaderboard-api.onrender.com/api/leaderboard')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud al servidor');
            }
            return response.json();
        })
        .then(scores => {
            console.log('Datos del leaderboard:', scores);
            const wasGameOver = gameOver;
            const wasGameStarted = gameStarted;
            gameOver = true;

            // Ocultar todos los botones mientras se muestra la pestaña
            document.getElementById('startButton').style.display = 'none';
            document.getElementById('jumpButton').style.display = 'none';
            document.getElementById('restartButton').style.display = 'none';
            document.getElementById('topScoresButton').style.display = 'none';

            // Fondo sólido para borrar el contenido previo
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Pestaña estilizada
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(canvas.width / 2 - 200, 50, 400, 300);
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - 200, 50, 400, 300);

            // Título del leaderboard
            ctx.fillStyle = '#333';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TOP 5 Scores', canvas.width / 2, 90);

            // Puntajes
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            if (scores.length === 0) {
                ctx.fillText('No hay puntajes aún', canvas.width / 2, 150);
            } else {
                scores.forEach((entry, index) => {
                    const yPosition = 120 + index * 30;
                    ctx.fillText(
                        `${index + 1}. ${entry.name}: ${formatNumber(entry.score)}`,
                        canvas.width / 2,
                        yPosition
                    );
                });
            }

            // Botón de cerrar (X)
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(canvas.width / 2 + 170, 50, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('X', canvas.width / 2 + 185, 70);

            // Función para cerrar el leaderboard
            function closeLeaderboard(event) {
                event.preventDefault();
                let clickX, clickY;

                // Determinar las coordenadas dependiendo del tipo de evento
                if (event.type === 'touchstart') {
                    const touch = event.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    clickX = touch.clientX - rect.left;
                    clickY = touch.clientY - rect.top;
                } else {
                    const rect = canvas.getBoundingClientRect();
                    clickX = event.clientX - rect.left;
                    clickY = event.clientY - rect.top;
                }

                // Verificar si el toque/clic está dentro del área de la "X"
                if (clickX >= canvas.width / 2 + 170 && clickX <= canvas.width / 2 + 200 &&
                    clickY >= 50 && clickY <= 80) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Restaurar el estado de los botones según el estado del juego
                    if (wasGameStarted && !wasGameOver) {
                        document.getElementById('startButton').style.display = 'none';
                        document.getElementById('jumpButton').style.display = 'block';
                        document.getElementById('restartButton').style.display = 'none';
                        gameOver = false;
                    } else if (wasGameOver) {
                        document.getElementById('startButton').style.display = 'none';
                        document.getElementById('jumpButton').style.display = 'none';
                        document.getElementById('restartButton').style.display = 'block';
                        gameOver = true;
                    } else {
                        document.getElementById('startButton').style.display = 'block';
                        document.getElementById('jumpButton').style.display = 'none';
                        document.getElementById('restartButton').style.display = 'none';
                        gameOver = false;
                    }

                    document.getElementById('topScoresButton').style.display = 'block';

                    if (wasGameStarted && !wasGameOver) {
                        requestAnimationFrame(gameLoop);
                    }

                    // Remover los eventos para evitar duplicados
                    canvas.removeEventListener('click', closeLeaderboard);
                    canvas.removeEventListener('touchstart', closeLeaderboard);
                }
            }

            // Añadir eventos para clic y toque
            canvas.addEventListener('click', closeLeaderboard);
            canvas.addEventListener('touchstart', closeLeaderboard);
        })
        .catch(error => {
            console.error('Error al obtener leaderboard:', error);
            const wasGameOver = gameOver;
            const wasGameStarted = gameStarted;
            gameOver = true;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(canvas.width / 2 - 200, 50, 400, 300);
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - 200, 50, 400, 300);

            ctx.fillStyle = '#d32f2f';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error al cargar', canvas.width / 2, 120);
            ctx.fillText('el leaderboard', canvas.width / 2, 150);
            ctx.fillText(error.message, canvas.width / 2, 180);

            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(canvas.width / 2 + 170, 50, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('X', canvas.width / 2 + 185, 70);

            // Función para cerrar el leaderboard
            function closeLeaderboard(event) {
                event.preventDefault();
                let clickX, clickY;

                if (event.type === 'touchstart') {
                    const touch = event.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    clickX = touch.clientX - rect.left;
                    clickY = touch.clientY - rect.top;
                } else {
                    const rect = canvas.getBoundingClientRect();
                    clickX = event.clientX - rect.left;
                    clickY = event.clientY - rect.top;
                }

                if (clickX >= canvas.width / 2 + 170 && clickX <= canvas.width / 2 + 200 &&
                    clickY >= 50 && clickY <= 80) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    if (wasGameStarted && !wasGameOver) {
                        document.getElementById('startButton').style.display = 'none';
                        document.getElementById('jumpButton').style.display = 'block';
                        document.getElementById('restartButton').style.display = 'none';
                        gameOver = false;
                    } else if (wasGameOver) {
                        document.getElementById('startButton').style.display = 'none';
                        document.getElementById('jumpButton').style.display = 'none';
                        document.getElementById('restartButton').style.display = 'block';
                        gameOver = true;
                    } else {
                        document.getElementById('startButton').style.display = 'block';
                        document.getElementById('jumpButton').style.display = 'none';
                        document.getElementById('restartButton').style.display = 'none';
                        gameOver = false;
                    }

                    document.getElementById('topScoresButton').style.display = 'block';

                    if (wasGameStarted && !wasGameOver) {
                        requestAnimationFrame(gameLoop);
                    }

                    canvas.removeEventListener('click', closeLeaderboard);
                    canvas.removeEventListener('touchstart', closeLeaderboard);
                }
            }

            canvas.addEventListener('click', closeLeaderboard);
            canvas.addEventListener('touchstart', closeLeaderboard);
        });
}

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

restartButton.addEventListener("click", () => {
    unlockAudio();
    restartGame();
});

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