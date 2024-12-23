const {getDatosBoletin} = require('../Model/getBoletinConcursal');

async function main(){
    try{
        console.log("----------------------------------------------");
        const startDate = new Date('2024/11/19'); // Fecha de inicio
        const endDate = new Date('2024/11/21'); 
        const tiempoInicio = new Date();
        await getDatosBoletin(startDate,endDate);
        const tiempoFin = new Date();
        console.log("Tiempo de ejecución para ", (tiempoFin-tiempoInicio)/1000, "segundos");
    }catch (error) {
        console.error('Error al obtener resultados en el index.js:', error);
    }
}

main();