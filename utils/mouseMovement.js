async function simulateRandomMouseMovement(page, duration = 3000, widthRange = 500) {
    try {

        // Obtener las dimensiones de la ventana
        const viewport = page.viewport();
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;

        // Tiempo de inicio
        const startTime = Date.now();

        // Posición inicial del mouse (centro de la pantalla)
        await page.mouse.move(centerX, centerY);

        // Función para generar un movimiento aleatorio suave
        const moveRandomly = async () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) return;

            // Calcular progreso (0 a 1)
            const progress = elapsed / duration;

            // Generar desplazamiento aleatorio con tendencia al centro
            const randomFactor = Math.random() * 2 - 1; // -1 a 1
            const x = centerX + (randomFactor * widthRange * (1 - progress * 0.7));

            // Pequeña variación en Y para hacerlo más natural
            const y = centerY + (Math.random() * 100 - 50);

            // Mover el mouse
            await page.mouse.move(x, y);

            // Tiempo entre movimientos (aleatorio entre 50ms y 200ms)
            const delay = 50 + Math.random() * 150;

            // Programar próximo movimiento
            setTimeout(moveRandomly, delay);
        };

        // Iniciar el movimiento
        await moveRandomly();
    }catch(error){
        console.log("Error al mover el mouse random", error.message);
    }
}
module.exports = {simulateRandomMouseMovement}