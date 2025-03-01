// Obtener el canvas y el contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Propiedades del dinosaurio
let dino = {
    x: 50,    // Posición horizontal (cerca del lado izquierdo)
    y: 300,   // Posición vertical (cerca del suelo)
    width: 40, // Ancho del dinosaurio
    height: 40, // Alto del dinosaurio
    dy: 0,     // Velocidad vertical (para el salto)
    gravity: 0.5, // Gravedad para que baje
    jumpPower: -10, // Fuerza del salto (negativo porque sube)
    grounded: true // Si está en el suelo
};

// Dibujar el dinosaurio
function drawDino() {
    ctx.fillStyle = "gray"; // Color del dinosaurio
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height); // Dibujar el rectángulo
}

// Actualizar la posición del dinosaurio
function updateDino() {
    if (!dino.grounded) {
        dino.dy += dino.gravity; // Aplicar gravedad
        dino.y += dino.dy;       // Actualizar posición vertical
    }

    // Si toca el suelo (y = 300), detener el movimiento
    if (dino.y >= 300) {
        dino.y = 300;
        dino.dy = 0;
        dino.grounded = true;
    }
}

// Bucle principal del juego
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
    updateDino(); // Actualizar posición
    drawDino();   // Dibujar el dinosaurio
    requestAnimationFrame(gameLoop); // Repetir el bucle
}

// Iniciar el juego
gameLoop();

// Escuchar la tecla para saltar
document.addEventListener("keydown", function(event) {
    if (event.code === "Space" && dino.grounded) {
        dino.dy = dino.jumpPower; // Aplicar fuerza de salto
        dino.grounded = false;    // Ya no está en el suelo
    }
});