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
        const maxDiffDate = 1;
        const maxRetries = 10;
        const casos = await getDatosRemate(fechaHoy,maxDiffDate,maxRetries);
        escribirEnArchivo(casos);
    }catch (error) {
        console.error('Error al obtener resultados:', error);
    }
    
}
main()