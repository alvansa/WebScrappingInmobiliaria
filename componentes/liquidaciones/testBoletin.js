const {getDatosBoletin} = require('./getBoletinConcursal');
const {getPdfData} = require('./procesarBoletin');

async function main(){
    const args = process.argv.slice(2);
    console.log(args);
    if(args.length === 0){
        console.log("No se ingresaron argumentos");
        return;
    }
    if(args[0] === "-d"){
        await obtenerDatos();
    }else if(args[0] === "-p"){
        await testDatosProcesados();
    }else{
        use();
    }
}

async function obtenerDatos(){
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

function use(){
    console.log("Uso: node testBoletin.js -d para probar la descarga de datos o node testEconomico.js -p para probar el procesamiento de los datos");
}


async function testDatosProcesados(){
    let casos = [];
    // const startDate = formatoFechaBoletin(fechaInicioStr);
    // const endDate = formatoFechaBoletin(fechaFinStr);
    const startDate = new Date('2025/01/17'); // Fecha de inicio
    const endDate = new Date('2025/01/24'); 
    const fechaHoy = new Date();

    try{
        casos = await getPdfData(startDate,endDate,fechaHoy) || [];
    }catch(error){
        console.error('Error al obtener resultados en el boletin:', error);
    }
    const casosObj = casos.map(caso => caso.toObject());
    console.log("Casos: ",casosObj);
}

main()