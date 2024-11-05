const { getPaginas } = require('./Model/ObtenerDatos.js');

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Agregar evento de clic al botón
    document.getElementById('obtenerResultados').addEventListener('click', mostrarResultados);
});

// Función para mostrar resultados
async function mostrarResultados() {
    const divResultados = document.getElementById('resultados');
    divResultados.innerHTML = ''; // Limpiar contenido anterior
    try {
        const resultados = await getPaginas(); // Esperar el resultado de getPaginas()
        console.log(resultados);
        resultados.forEach(resultado => {
            const p = document.createElement('p');
            // Aquí asumo que 'resultado' tiene propiedades como 'causa' y 'juzgado'
            p.textContent = `Causa: ${resultado.causa}, Juzgado: ${resultado.juzgado}`;
            divResultados.appendChild(p);
        });
    } catch (error) {
        console.error('Error al mostrar resultados:', error);
        divResultados.innerHTML = 'Error al obtener resultados.';
    }
}