const {testUnico} = require('./Controller/datosRemate.js');

async function main(){
    try {
        const link = 'https://www.economicos.cl/remates/clasificados-remates-cod47534575.html';
        const fechaHoy = new Date();
        const caso = await testUnico(fechaHoy,link);

    }catch (error) {
        console.error('Error al obtener resultados:', error);
    }
}
main()