const {crearBase,insertarDatos} = require('./Controller/createXLSX');

async function main(){
    try{
        const fechaHoy = new Date();
        const maxDiffDate = 3;
        const fechaInicioStr = "2024-11-14";
        const fechaFinStr = "2024-11-15";
        const maxRetries = 10;
        resultado = await insertarDatos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries);
        if(resultado){
            console.log('Datos insertados correctamente');
        }else{
            console.log('Error al insertar datos');
        }
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}
main();