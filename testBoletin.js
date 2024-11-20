const {getDatosBoletin} = require('./Model/getBoletinConcursal');

async function main(){
    try{
        const tiempoInicio = new Date();
        await getDatosBoletin();
        const tiempoFin = new Date();
        console.log("Tiempo de ejecución para ", (tiempoFin-tiempoInicio)/1000, "segundos");
    }catch (error) {
        console.error('Error al obtener resultados en el index.js:', error);
    }
}

main();