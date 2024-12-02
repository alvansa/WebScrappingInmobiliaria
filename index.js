const fs = require('fs');

const {getDatosRemate, testUnico} = require('./Controller/datosRemate.js');

// Esperar a que el DOM esté completamente cargado
// document.addEventListener('DOMContentLoaded', () => {
//     // Agregar evento de clic al botón
//     document.getElementById('obtenerResultados').addEventListener('click', mostrarResultados);
// });

// // Función para mostrar resultados
// async function mostrarResultados() {
//     const divResultados = document.getElementById('resultados');
//     divResultados.innerHTML = ''; // Limpiar contenido anterior
//     try {
//         const resultados = await getPaginas(); // Esperar el resultado de getPaginas()
//         console.log(resultados);
//         resultados.forEach(resultado => {
//             const p = document.createElement('p');
//             // Aquí asumo que 'resultado' tiene propiedades como 'causa' y 'juzgado'
//             p.textContent = `Causa: ${resultado.causa}, Juzgado: ${resultado.juzgado}`;
//             divResultados.appendChild(p);
//         });
//     } catch (error) {
//         console.error('Error al mostrar resultados:', error);
//         divResultados.innerHTML = 'Error al obtener resultados.';
//     }
// }

function escribirEnArchivo(casos) {
    casoObj = casos.map(caso => caso.toObject());
    const jsonData = JSON.stringify(casoObj, null, 2);
        filePath = 'casos.json';
        fs.writeFile(filePath, jsonData, (err) => {
            if (err) {
                console.error("An error occurred while writing the file:", err);
            } else {
                console.log("Data saved successfully to", filePath);
            }
        });
}


//Funcion principal
async function main(){
    try {
        const fechaHoy = new Date();
        const fechaInicioStr = "2024-12-01";
        const fechaFinStr = "2024-12-02";
        const maxDiffDate = 1;
        const maxRetries = 10;
        const tiempoInicio = new Date();
        const casos = await getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries);
        const tiempoFin = new Date();
        escribirEnArchivo(casos);
        console.log(typeof(casos));
        console.log("Tiempo de ejecución para ",casos.length ," casos: ", (tiempoFin-tiempoInicio)/1000, "segundos");
    }catch (error) {
        console.error('Error al obtener resultados en el index.js:', error);
    }
    
}

main();
function test(){
    console.log("test");
}


module.exports = {main, test};