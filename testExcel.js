const {crearBase,insertarDatos} = require('./Controller/createXLSX');

async function main(){
    try{
        const fechaHoy = new Date();
        const maxDiffDate = 7;
        const maxRetries = 10;
        resultado = await insertarDatos(fechaHoy,maxDiffDate,maxRetries);
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